const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
const contractAccount = '0xb2f02628d8D38B14288ec53eCbF482a433fa214b';
const abi = JSON.parse('[{"constant":true,"inputs":[{"name":"candidate","type":"bytes32"}],"name":"totalVotesFor","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"candidate","type":"bytes32"}],"name":"validCandidate","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"candidateList","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"candidate","type":"bytes32"}],"name":"voteForCandidate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"candidateNames","type":"bytes32[]"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"}]');
const votingContract = new web3.eth.Contract(abi,contractAccount);
const candidates = {
  'dan': 'candidate-1',
  'lee': 'candidate-2',
  'ben': 'candidate-3',
};
const voteButton = document.querySelector('.vote_button');

let account = null;

const voteForCandidate=()=>{
    const candidateInput = document.querySelector('#candidate');
    const candidateName = candidateInput.value.toLowerCase();
    votingContract.methods.voteForCandidate(web3.utils.asciiToHex(candidateName))
        .send({from: account, gas: 4700000})
        .then(()=>{
            let id = candidates[candidateName];
            votingContract.methods
            .totalVotesFor(web3.utils.asciiToHex(candidateName))
            .call()
            .then((count)=>{
                const candidate = document.querySelector(`#${id}`);
                candidate.textContent = count;
                candidateInput.value = '';
            })
    });
}

const init=()=>{
    web3.eth.getAccounts((err,accounts)=>{
        if(err){
            alert('There was an error fetching your accounts.');
            return
        }
        if(accounts.length===0){
            alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.")
            return
        }

        account = accounts[0];
    });
    const candidateNames = Object.keys(candidates);
    candidateNames.forEach((candidate)=>{
        votingContract.methods
        .totalVotesFor(web3.utils.asciiToHex(candidate))
        .call()
        .then((count)=>{
            document.querySelector(`#${candidates[candidate]}`).textContent = count;
        })
    });

    voteButton.addEventListener('click', voteForCandidate);
};

window.onload=()=>{
    init();
}


