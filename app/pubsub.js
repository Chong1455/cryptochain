const PubNub = require('pubnub');

const credentials = {
	publishKey: 'pub-c-6ab0acd3-28e6-40cc-a19b-2cdd9978e02c',
	subscribeKey: 'sub-c-3dbbb2f0-86aa-11ea-965b-8ea1ff3ad6ee',
	secretKey: 'sec-c-NmY0OTM0MDAtMmE4MC00ODBhLWI5MzMtMTJmZjNiNTJlNDkx'
};

const CHANNELS = {
	TEST: 'TEST',
	BLOCKCHAIN: 'BLOCKCHAIN',
	TRANSACTION: 'TRANSACTION'
};

class PubSub {
	constructor({ blockchain, transactionPool, wallet }) {
		this.blockchain = blockchain;
		this.transactionPool = transactionPool;
		this.wallet = wallet;
		
		this.pubnub = new PubNub(credentials);
		
		this.pubnub.subscribe({ channels: Object.values(CHANNELS) });
		
		this.pubnub.addListener(this.listener());
	}

	subscribeToChannels() {
		this.pubnub.subscribe({
			channels: [Object.values(CHANNELS)]
		});
	}

	listener() {
		return {
			message: messageObject => {
				const { channel, message } = messageObject;

				console.log(`Message received. Channel: ${channel}. Message: ${message}`);
				const parsedMessage = JSON.parse(message);

				switch(channel) {
					case CHANNELS.BLOCKCHAIN:
						this.blockchain.replaceChain(parsedMessage, true, () => {
							this.transactionPool.clearBlockchainTransactions({
								chain: parsedMessage
							});
						});
						break;
					case CHANNELS.TRANSACTION:
						if (!this.transactionPool.existingTransaction({
							inputAddress: this.wallet.publicKey
						})) {
							this.transactionPool.setTransaction(parsedMessage);
						}
						break;
					default:
						return;
				}
			}
		}
	}

	publish({ channel, message }) {
		this.pubnub.publish({ channel, message });
	}

	broadcastChain() {
		this.publish({
			channel: CHANNELS.BLOCKCHAIN,
			message: JSON.stringify(this.blockchain.chain)
		});
	}

	broadcastTransaction(transaction) {
		this.publish({
			channel: CHANNELS.TRANSACTION,
			message: JSON.stringify(transaction)
		});
	}
}

module.exports = PubSub;