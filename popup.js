const findMovie = async () => {
    const searchResults = document.querySelector('#searchResults');
    searchResults.innerText = '';
    const title = document.querySelector('#search').value;
    const rpc = await getRpc();
    const contractAddress = await getContract();
    const web3 = new Web3(rpc);
    const contract = new web3.eth.Contract(contractAbi, contractAddress, {});
    const movies = (await contract.methods.findMovies(title).call()).filter(
        m => !!m.title);

    for (const movie of movies) {
        const resultContainer = document.createElement('div');
        resultContainer.classList.add('searchResult');

        const length = new Date(Number(movie.best) * 1000);
        const movieTitle = document.createElement('span');
        movieTitle.innerText = `${movie.title} (${length.getUTCHours()}:${length.getUTCMinutes().
            toFixed().
            padStart(2, '0')}:${length.getUTCSeconds().
            toFixed().
            padStart(2, '0')})`;
        resultContainer.appendChild(movieTitle);

        const stopButton = document.createElement('button');
        stopButton.innerText = 'Schedule stop';
        stopButton.dataset.bestStopTime = movie.best;
        stopButton.addEventListener('click', happyEndHandler);
        if (window.location.protocol === 'chrome-extension:') {
            resultContainer.appendChild(stopButton);
        }

        searchResults.appendChild(resultContainer);
    }
    if (!movies.length) {
        searchResults.innerText = 'Nothing found';
    }
};

const saveTime = async () => {
    document.querySelector('#error').innerText = '';
    document.querySelector('#success').innerText = '';
    const titleInput = document.querySelector('#title');
    const title = titleInput.value.replace(/\s+/g, ' ').trim();
    if (!/.+\s\d{4}/.test(title)) {
        return document.querySelector(
            '#error').innerText = 'Invalid title format';
    }
    const timeInput = document.querySelector('#time');
    const time = timeInput.value.replace(/\s+/g, ' ').trim();
    if (!/\d:\d{2}:\d{2}/.test(time)) {
        return document.querySelector(
            '#error').innerText = 'Invalid time format';
    }
    const [h, m, s] = time.split(':');
    if (Number(s) >= 60 || Number(m) >= 60) {
        return document.querySelector(
            '#error').innerText = 'Invalid time format';
    }
    const seconds = Number(s) + Number(m) * 60 + Number(h) * 60 * 60;
    const contractAddress = await getContract();
    const web3 = new Web3(window.ethereum);
    await window.ethereum.enable();
    const accounts = await window.ethereum.request(
        { method: 'eth_requestAccounts' });
    const contract = new web3.eth.Contract(contractAbi, contractAddress,
        { from: accounts[0] });
    await contract.methods.addMovie(title, seconds).
        send({ value: web3.utils.toWei('0.1', 'ether') });
    document.querySelector('#success').innerText = 'New move added';
};

const happyEndHandler = async (event) => {
    document.querySelector('#error').innerText = '';
    document.querySelector('#success').innerText = '';
    const [tab] = await chrome.tabs.query(
        { active: true, currentWindow: true });
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        args: [Number(event.target.dataset.bestStopTime)],
        function: (bestStopMoment) => {
            const video = findPlayingVideo();
            if (video) {
                setInterval(() => {
                    handlePlayingVideo(video, bestStopMoment);
                }, 1000);
                return true;
            } else {
                return false;
            }
        },
    }, (injectionResults) => {
        for (const frameResult of injectionResults) {
            if (frameResult.result) {
                return document.querySelector(
                    '#success').innerText = 'Scheduled';
            }
        }
        return document.querySelector(
            '#error').innerText = 'No playing video found';
    });
};

const getRpc = async () => {
    const defaultRpc = 'https://rpc.ankr.com/avalanche';
    if (window.location.protocol !== 'chrome-extension:') {
        return defaultRpc;
    }
    const rpc = await new Promise(resolve => {
        chrome.storage.sync.get('rpc', ({ rpc }) => {
            resolve(rpc);
        });
    });
    return rpc || defaultRpc;
};

const getContract = async () => {
    const defaultContract = '0xB27D1129E07b6c0a22d8D683ea7a9FE2203f1c27';
    if (window.location.protocol !== 'chrome-extension:') {
        return defaultContract;
    }
    const contract = await new Promise(resolve => {
        chrome.storage.sync.get('contract', ({ contract }) => {
            resolve(contract);
        });
    });
    return contract || defaultContract;
};

const saveRpc = () => {
    const rpc = document.querySelector('#rpc').value;
    chrome.storage.sync.set({ rpc });
};

const saveContract = () => {
    const contract = document.querySelector('#contract').value;
    chrome.storage.sync.set({ contract });
};

document.querySelector('[data-action="search"]').
    addEventListener('click', findMovie);
document.querySelector('[data-action="add"]').
    addEventListener('click', saveTime);
document.querySelector('[data-action="rpc"]').
    addEventListener('click', saveRpc);
document.querySelector('[data-action="contract"]').
    addEventListener('click', saveContract);
getRpc().then(rpc => {
    document.querySelector('#rpc').value = rpc;
});
getContract().then(contract => {
    document.querySelector('#contract').value = contract;
});
if (window.location.protocol === 'chrome-extension:') {
    document.querySelector('#canAdd').style.display = 'none';
} else {
    document.querySelector('#linkAdd').style.display = 'none';
}
const contractAbi = [
    {
        'inputs': [
            {
                'internalType': 'string',
                'name': 'title',
                'type': 'string',
            },
            {
                'internalType': 'uint256',
                'name': 'stopTime',
                'type': 'uint256',
            },
        ],
        'name': 'addMovie',
        'outputs': [],
        'stateMutability': 'payable',
        'type': 'function',
    },
    {
        'inputs': [
            {
                'internalType': 'bytes32',
                'name': 'id',
                'type': 'bytes32',
            },
            {
                'internalType': 'uint256',
                'name': 'stopTime',
                'type': 'uint256',
            },
        ],
        'name': 'addStopTime',
        'outputs': [],
        'stateMutability': 'payable',
        'type': 'function',
    },
    {
        'inputs': [
            {
                'internalType': 'string',
                'name': 'title',
                'type': 'string',
            },
        ],
        'name': 'findMovies',
        'outputs': [
            {
                'components': [
                    {
                        'internalType': 'bytes32',
                        'name': 'id',
                        'type': 'bytes32',
                    },
                    {
                        'internalType': 'string',
                        'name': 'title',
                        'type': 'string',
                    },
                    {
                        'internalType': 'uint256[]',
                        'name': 'proposed',
                        'type': 'uint256[]',
                    },
                    {
                        'internalType': 'uint256',
                        'name': 'best',
                        'type': 'uint256',
                    },
                ],
                'internalType': 'struct HappyEnd.Movie[]',
                'name': '',
                'type': 'tuple[]',
            },
        ],
        'stateMutability': 'view',
        'type': 'function',
    },
];
