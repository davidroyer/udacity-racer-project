// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE
var stopInterval = false;
// The store will hold all information needed globally
var store = {
  track_id: undefined,
  player_id: undefined,
  race_id: undefined
};

let raceInterval = null;
let countdownInterval = null;

// We need our javascript to wait until the DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
  onPageLoad();
  setupClickHandlers();
});

async function onPageLoad() {
  try {
    getTracks().then(tracks => {
      const html = renderTrackCards(tracks);
      renderAt('#tracks', html);
    });

    getRacers().then(racers => {
      const html = renderRacerCars(racers);
      renderAt('#racers', html);
    });
  } catch (error) {
    console.log('Problem getting tracks and racers ::', error.message);
    console.error(error);
  }
}

function setupClickHandlers() {
  document.addEventListener(
    'click',
    function (event) {
      const { target } = event;

      // Race track form field
      if (target.matches('.card.track')) {
        handleSelectTrack(target);
      }

      // Podracer form field
      if (target.matches('.card.podracer')) {
        handleSelectPodRacer(target);
      }

      // Submit create race form
      if (target.matches('#submit-create-race')) {
        event.preventDefault();

        // start race
        handleCreateRace();
      }

      // Handle acceleration click
      if (target.matches('#gas-peddle')) {
        handleAccelerate(target);
      }
    },
    false
  );
}

async function delay(ms) {
  try {
    return await new Promise(resolve => setTimeout(resolve, ms));
  } catch (error) {
    console.log(error);
  }
}
// ^ PROVIDED CODE ^ DO NOT REMOVE

// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {
  // Get player_id and track_id from the store
  const { player_id, track_id } = store;

  // Invoke the API call to create the race, then save the result
  const newRace = await createRace(player_id, track_id);

  // Update the store with the race id
  store = {
    ...store,
    race_id: newRace.ID
  };

  // render starting UI
  renderAt('#race', renderRaceStartView(newRace.Track, newRace.Cars));

  const countdownResult = await runCountdown();

  // Call the async function startRace
  const newRaceStarted = await startRace(store.race_id - 1);

  // Call the async function runRace
  runRace(store.race_id - 1);
}

function runRace(raceID) {
  return new Promise(resolve => {
    // NOTE - use Javascript's built in setInterval method to get race info
    // every 500ms
    let raceInterval = setInterval(async () => {
      let currentRace = await getRace(raceID);

      if (!stopInterval && currentRace.status === 'in-progress') {
        renderAt('#leaderBoard', raceProgress(currentRace.positions));
      } else {
        clearInterval(raceInterval);
        renderAt('#race', resultsView(currentRace.positions)); // to render the results view
        resolve(currentRace); // resolve the promise
      }
    }, 500);
  });
}

async function runCountdown() {
  try {
    // wait for the DOM to load
    await delay(1000);
    let timer = 3;

    return new Promise(resolve => {
      countdownInterval = setInterval(() => {
        if (timer === 0) {
          clearInterval(countdownInterval);
          // NOTE - If the countdown is done, clear the interval, resolve the promise, and return
          return resolve();
        } else {
          // NOTE - Use Javascript's built in setInterval method to count down once per second
          document.getElementById('big-numbers').innerHTML = --timer;
        }
      }, 1000);
    });
  } catch (error) {
    console.log(error);
  }
}

function handleSelectTrack(target) {
  // remove class selected from all track options
  const selected = document.querySelector('#tracks .selected');
  if (selected) {
    selected.classList.remove('selected');
  }

  // add class selected to current target
  target.classList.add('selected');

  // NOTE - save the selected track id to the store
  store = {
    ...store,
    track_id: parseInt(target.id)
  };
}

function handleSelectPodRacer(target) {
  // remove class selected from all racer options
  const selected = document.querySelector('#racers .selected');
  if (selected) {
    selected.classList.remove('selected');
  }

  // add class selected to current target
  target.classList.add('selected');

  // Save the selected racer to the store
  store = {
    ...store,
    player_id: parseInt(target.id)
  };
}

function handleAccelerate() {
  // Invoke the API call to accelerate
  accelerate(store.race_id - 1);
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

function renderError(error) {
  return `
        <header class="down">
            <h1 class="header-title">An Error Occured!</h1>
        </header>
        <main>
            <section>
                ${error.message}
            </section>
            <section>
                <a class="button center" href="/">Back to Home Page</a>
            </section>
        </main>
    `;
}

function renderRacerCars(racers) {
  if (!racers.length) {
    return `
			<h4>Loading Racers...</4>
		`;
  }

  const results = racers.map(renderRacerCard).join('');

  return `
		<ul id="racers">
			${results}
		</ul>
	`;
}

function renderRacerCard(racer) {
  const { id, driver_name, top_speed, acceleration, handling } = racer;

  return `
		<li class="card podracer" id="${id}">
			<h3>${driver_name}</h3>
			<p>${top_speed}</p>
			<p>${acceleration}</p>
			<p>${handling}</p>
		</li>
	`;
}

function renderTrackCards(tracks) {
  if (!tracks.length) {
    return `
			<h4>Loading Tracks...</4>
		`;
  }

  const results = tracks.map(renderTrackCard).join('');

  return `
		<ul id="tracks">
			${results}
		</ul>
	`;
}

function renderTrackCard(track) {
  const { id, name } = track;

  return `
		<li id="${id}" class="card track">
			<h3>${name}</h3>
		</li>
	`;
}

function renderCountdown(count) {
  return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`;
}

function renderRaceStartView(track, racers) {
  return `
		<header>
			<h1 class="header-title">Race: ${track.name}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`;
}

function resultsView(positions) {
  positions.sort((a, b) => (a.final_position > b.final_position ? 1 : -1));

  return `
		<header>
			<h1 class="header-title">Race Results</h1>
		</header>
		<main>
			${raceProgress(positions)}
			<a href="/race">Start a new race</a>
		</main>
	`;
}

function raceProgress(positions) {
  let userPlayer = positions.find(e => e.id === store.player_id);

  if (!userPlayer) {
    clearInterval(countdownInterval);
    clearInterval(raceInterval);
    renderAt('#race', renderError({ message: 'player not found!' }));
    return;
  }

  userPlayer.driver_name += ' (you)';
  positions = positions.sort((a, b) => (a.segment > b.segment ? -1 : 1));

  let count = 1;

  const results = () =>
    positions.map(p => {
      return `
			<tr>
				<td>
					<h3>${count++} - ${p.driver_name}</h3>
				</td>
			</tr>
		`;
    });

  return `
		<main>
			<h3>Leaderboard</h3>
			<section id="leaderBoard">
				${results()}
			</section>
		</main>
	`;
}

function renderAt(element, html) {
  const node = document.querySelector(element);
  node.innerHTML = html;
}

// API CALLS ------------------------------------------------

const SERVER = 'http://localhost:8000';

function defaultFetchOpts() {
  return {
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': SERVER
    }
  };
}

// TODO - Make a fetch call (with error handling!) to each of the following API endpoints

async function getTracks() {
  const response = await fetch(`${SERVER}/api/tracks`);
  return await response.json();
}

async function getRacers() {
  try {
    const response = await fetch(`${SERVER}/api/cars`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.log('Problem with getRacers request ->', error);
  }
}

function createRace(player_id, track_id) {
  player_id = parseInt(player_id);
  track_id = parseInt(track_id);
  const body = { player_id, track_id };

  return fetch(`${SERVER}/api/races`, {
    method: 'POST',
    ...defaultFetchOpts(),
    dataType: 'jsonp',
    body: JSON.stringify(body)
  })
    .then(res => res.json())
    .catch(err => console.log('Problem with createRace request ->', err));
}

async function getRace(id) {
  try {
    const response = await fetch(`${SERVER}/api/races/${id}`);
    return await response.json();
  } catch (error) {
    console.log('Problem with getRace request ->', error);
  }
}

async function startRace(id) {
  try {
    const response = await fetch(`${SERVER}/api/races/${id}/start`, {
      method: 'POST',
      ...defaultFetchOpts()
    });

    return await response.json;
  } catch (error) {
    console.log('Problem with startRace request ->', error);
  }
}

function accelerate(id) {
  return fetch(`${SERVER}/api/races/${id}/accelerate`, {
    method: 'POST'
  });
}
