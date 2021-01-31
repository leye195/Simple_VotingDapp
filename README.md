# Simple Voting Dapp

- Ganache를 활용한 Simple Voting Dapp 실습

### Web3 인스턴스 생성

```js
const Web3 = require("web3");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

console.log(web3.eth.accounts); //account 목록 출력
console.log(web3.eth.getBalance(account).toNumber()); //해당 계정이 소유하고 있는 밸런스 출력
//출력하는 값의 단위는 wei (1eth = 10^18 wei) 이기 때문에 출력값/10^18을 해줘야 소유하고 있는
//eth의 양을 확인 할 수 있음

console.log(web3.fromWei(100000000000000000000, "ether")); //100 출력
//eth 단위로 환산

//위 코드를 축약하면 아래 형식으로 작성 가능
web3.fromWei(
  web3.eth.getBalance("0x352e047734a52bff0e95969d80a02300f9551c15").toNumber(),
  "ether"
);
```

### Solidity로 Contract 작성

```
//remix를 활용해 contract 작성

pragma solidity ^0.4.23;


contract Voting {
	bytes32[] public candidateList;
	mapping (bytes32 => uint8) voteReceived;
	// ex) nick => 5 , Dan => 4

  //생성자는 컨트랙트가 배포될 때 딱 한 번만 초기화되며, 같은 소스의 컨트랙트를 여러번 배포할 경우
	//서로 다른 인스턴스가 블록체인 상에 여러개가 생기게 될 뿐
	constructor(bytes32[] candidateNames) {
		candidateList = candidateNames;
	}

	function voteForCandidate(bytes32 candidate) public {
    //require문을 활용해 유효 체크, true인 경우 다음 코드 실행, false인 경우 끝
	  require(validCandidate(candidate),'There is no such candidate on the list');
		voteReceived[candidate]+=1;
	}

	//view는 읽기 전용을 의미, returns(type)는 함수가 리턴할 타입을 명시
	function totalVotesFor(bytes32 candidate) view public returns(uint8) {
		require(validCandidate(candidate));
    return voteReceived[candidate];
	}

	//candidate가 유효한지 체크
	function validCandidate(bytes32 candidate) view public return(bool) {
		for(uint i=0;i<candidateList.length;i++){
			if(candidateList[i]==candidate)
				return true;
		}
		return false;
	}
}
```

**soljs를 활용한 solidity 코드 컴파일**

`node_modules/.bin/soljs --bin --abi Voting.sol` 명령어 입력

바이트 코드(.bin), .abi 파일 생성됨 (**컨트랙트와 상호작용 하기 위한 2가지 필수 파일**)

- 바이트 코드는 블록체인에 실제로 배포되는 것임
- abi는 바이너리 인터페이스의 준말로 (application binary interface) 일종의 컨트랙트의 템플릿, 인터페이스로 볼 수 있음 (**사용자에게 어떤 메소드들을 쓸 수 있는지 알려주는 역활을 함**)

  → 언제든지 컨트렉트와 상호작용을 하기 위해서는 abi 정의가 있어야 됨

**블록체인에 배포**

1.바이트 코드 불러오기

```js
byteCode = fs.readFileSync("./Voting_sol_Voting.bin").toString();
```

2.abi 불러오기

```js
abi = JSON.parse(fs.readFileSync("./Voting_sol_Voting.abi").toString());
```

3.컨트랙트 배포

```js
deployedContract = web3.eth.Contract(abi);
deployedContract.deploy({
	data: byteCode,
	arguments: [['Dan','Lee','Ben']],map(name=>web3.utils.asciiToHex(name))]
}).send({
	from: '0x352e047734a52bFf0e95969d80A02300f9551C15',
	gas: 1500000,
	gasPrice: web3.utils.toWei('0.00001','ether')
}).then((newContractInstance) => {
	deployedContract.options.address = newContractInstance.options.address;
});

deployedContract.options.address; //컨트랙트 주소
deployedContract.methods; //배포한 컨트랙트 함수 목록
```

4.컨트랙트와 상호작용

```js
/*
.call: 읽기 전용일 경우에만 호출해 활용
.send: 일반 호출, 블록체인의 상태를 변화 시키는 경우
읽기 전용 호출와 일반 호출의 차이는 블록체인의 상태를 바꾸는가 아닌가의 차이
*/
//ex)
deployedContract.methods
  .totalVotesFor(web3.utils.asciiToHex("dan"))
  .call()
  .then((count) => console.log(count));

deployedContract.methods
  .voteForCandidate(web3.utils.asciiToHex("dan"))
  .send({ from: web3.eth.accounts[0] })
  .then((res) => console.log(res));
```

5.프론트엔드 구현 및 호출

```js
//ex) 아래와 같은 방식으로 작성
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
const contractAddress = "0xb2f02628d8D38B14288ec53eCbF482a433fa214b";
const abi = JSON.parse(
  '[{"constant":true,"inputs":[{"name":"candidate","type":"bytes32"}],"name":"totalVotesFor","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"candidate","type":"bytes32"}],"name":"validCandidate","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"candidateList","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"candidate","type":"bytes32"}],"name":"voteForCandidate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"candidateNames","type":"bytes32[]"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"}]'
);
const votingContract = new web3.eth.Contract(abi, contractAddress);
const candidates = {
  dan: "candidate-1",
  lee: "candidate-2",
  ben: "candidate-3",
};
const voteButton = document.querySelector(".vote_button");

let account = null;

const voteForCandidate = () => {
  const candidateInput = document.querySelector("#candidate");
  const candidateName = candidateInput.value.toLowerCase();
  votingContract.methods
    .voteForCandidate(web3.utils.asciiToHex(candidateName))
    .send({ from: account, gas: 4700000 })
    .then(() => {
      let id = candidates[candidateName];
      votingContract.methods
        .totalVotesFor(web3.utils.asciiToHex(candidateName))
        .call()
        .then((count) => {
          const candidate = document.querySelector(`#${id}`);
          candidate.textContent = count;
          candidateInput.value = "";
        });
    });
};

const init = () => {
  web3.eth.getAccounts((err, accounts) => {
    if (err) {
      alert("There was an error fetching your accounts.");
      return;
    }
    if (accounts.length === 0) {
      alert(
        "Couldn't get any accounts! Make sure your Ethereum client is configured correctly."
      );
      return;
    }

    account = accounts[0];
  });
  const candidateNames = Object.keys(candidates);
  candidateNames.forEach((candidate) => {
    votingContract.methods
      .totalVotesFor(web3.utils.asciiToHex(candidate))
      .call()
      .then((count) => {
        document.querySelector(`#${candidates[candidate]}`).textContent = count;
      });
  });
  voteButton.addEventListener("click", voteForCandidate);
};

window.onload = () => {
  init();
};
```
