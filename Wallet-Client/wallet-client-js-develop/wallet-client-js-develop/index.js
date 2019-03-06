const { EnclaveFactory } = require('./enclave')
const { SawtoothClientFactory } = require('./sawtooth-client')
var logger = require('./logger').Logger;

const argv = require('yargs')
  .usage('Usage: node $0 --name [string] --action [createwallet,withdrawfromwallet,deposittowallet,displaywallet] --value [integer]')
  .choices('action', ['createwallet', 'withdrawfromwallet', 'deposittowallet','displaywallet'])
  .number('value')
  .string(['action', 'name'])
  .describe('name', 'unique identifier for the entry')
  .describe('action', 'action to take on the entry')
  .describe('value', 'value to pass to the entry')
  .example('node index.js --name foo --action createwallet --value 42', 'If `foo` is undefined, create it and set its value to 42')
  .example('node index.js --name foo --action deposittowallet --value 13', 'If `foo` is defined, increment it by 13')
  .example('node index.js --name foo --action withdrawfromwallet --value 7', 'If `foo` is defined, decrement it by 7 (but not below 0)')
  .example('node index.js --name foo --action displaywallet --value 0', 'If `foo` is defined, displays the value (--value as 0 )')
  .wrap(null)
  .demandOption(['name', 'action', 'value'])
  .help('h')
  .alias('h', 'help')
  .argv

const env = require('./env')
const input = require('./input')


const enclave = EnclaveFactory(Buffer.from(env.privateKey, 'hex'))

const walletClient = SawtoothClientFactory({
  enclave: enclave,
  restApiUrl: env.restApiUrl
})

const walletTransactor = walletClient.newTransactor({
  familyName: env.familyName,
  familyVersion: env.familyVersion
})

const newPayload = {
  Action: argv.action,
  Name: argv.name,
  Value: argv.value
}

if (input.payloadIsValid(newPayload)) {
	logger.info("Valid payload is getting submitted... "+newPayload)
  input.submitPayload(newPayload, walletTransactor)
} else {
	logger.info("Invalid Valid payload ... Not submitted... ")
  console.log(`Oops! Your payload failed validation and was not submitted.`)
}
