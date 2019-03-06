const { TransactionHandler } = require('sawtooth-sdk/processor/handler')
const { InvalidTransaction, InternalError } = require('sawtooth-sdk/processor/exceptions')
const cbor = require('cbor')
const crypto = require('crypto')

var logger = require('./logger').Logger;

const _hash = (x) =>
  crypto.createHash('sha512').update(x).digest('hex').toLowerCase()
  
const TP_FAMILY = 'wallet-js'
const TP_NAMESPACE = _hash(TP_FAMILY).substring(0, 6)
const TP_VERSION = '1.0'

	// Constants defined in wallet specification
	const MIN_VALUE = 0
	const MAX_VALUE = 25000
	const MAX_NAME_LENGTH = 20
		
	const _decodeCbor = (buffer) =>
	  new Promise((resolve, reject) =>
	    cbor.decodeFirst(buffer, (err, obj) => (err ? reject(err) : resolve(obj)))
	  )

	const _toInternalError = (err) => {
	  let message = (err.message) ? err.message : err
	  throw new InternalError(message)
	}

	const _setEntry = (context, address, stateValue) => {
	  logger.info("Set Entry called with value "+stateValue);
	  let entries = {
	    [address]: cbor.encode(stateValue)
	  }
	  return context.setState(entries)
	}
	
	

	const _createWallet= (context, address, name, value) => (possibleAddressValues) => {
	  logger.info("Create Wallet called with value "+value);
	  let stateValueRep = possibleAddressValues[address]

	  let stateValue
	  if (stateValueRep && stateValueRep.length > 0) {
	    stateValue = cbor.decodeFirstSync(stateValueRep)
	    let stateName = stateValue[name]
	    if (stateName) {
	      throw new InvalidTransaction(
	        `Verb is "set" but Name already in state, Name: ${name} Value: ${stateName}`
	      )
	    }
	  }

	  // 'set' passes checks so store it in the state
	  if (!stateValue) {
	    stateValue = {}
	  }

	  stateValue[name] = value

	  return _setEntry(context, address, stateValue)
	}

	
	const _displayWallet= (context, address, name, value) => (possibleAddressValues) => {
		logger.info("Display Wallet called ");
	  let stateValueRep = possibleAddressValues[address]

	  let stateValue
	  if (stateValueRep && stateValueRep.length > 0) {
	    stateValue = cbor.decodeFirstSync(stateValueRep)
	    let stateName = stateValue[name]
	    if (stateName) {
	    //  throw new InvalidTransaction(
	      //  `Verb is "set" but Name already in state, Name: ${name} Value: ${stateName}`
	      //)
	    }
	  }

	  // 'set' passes checks so store it in the state
	  if (!stateValue) {
	    stateValue = {}
	  }

	  //stateValue[name] = value
	  logger.info("Display wallet Action result is "+ stateValue[name]);
	  return  stateValue[name]
	}
	

	const _applyOperator = (verb, op) => (context, address, name, value) => (possibleAddressValues) => {
		
		logger.info("Apply operator called with op "+op+" "+ name +" "+value);
		logger.info("Min & Max value :"+MIN_VALUE+" "+MAX_VALUE)
		 // console.log(":: "+MIN_VALUE+" "+MAX_VALUE);
		  let stateValueRep = possibleAddressValues[address]
		  if (!stateValueRep || stateValueRep.length === 0) {
		    throw new InvalidTransaction(`Verb is "${verb}" but Name is not in state`)
		  }

		  let stateValue = cbor.decodeFirstSync(stateValueRep)
		  if (stateValue[name] === null || stateValue[name] === undefined) {
		    throw new InvalidTransaction(`Verb is "${verb}" but Name is not in state`)
		  }
		  logger.info("Existing  value :"+stateValue[name]+"Added/deleted value "+value)
		  const result = op(stateValue[name], value)
		  logger.info("Updated wallet value :"+result)
		  
		  if (result < MIN_VALUE) {
		    throw new InvalidTransaction(
		      `Verb is "${verb}", but result would be less than ${MIN_VALUE}`
		    )
		  }

		  if (result > MAX_VALUE) {
		    throw new InvalidTransaction(
		      `Verb is "${verb}", but result would be greater than ${MAX_VALUE}`
		    )
		  }

		  // Increment the value in state by value
		   stateValue[name] = op(stateValue[name], value)
		  stateValue[name] = result
		  return _setEntry(context, address, stateValue)
		}
	

	class WalletHandler extends TransactionHandler {
	
	  constructor() {
	    super(TP_FAMILY, [TP_VERSION], [TP_NAMESPACE])
	  }

	  apply(transactionProcessRequest, context) {
		  //console.log("apply called");
		  logger.info("Wallet Handler called ...");
	    return _decodeCbor(transactionProcessRequest.payload)
	    
	      .catch(_toInternalError)
	      .then((update) => {
	    	  console.log(update); 
	    	let name = update.Name
		    if (!name) {
		          throw new InvalidTransaction('Name is required')
		    }
	       
	        let action = update.Action
	        if (!action) {
	          throw new InvalidTransaction('Action is required')
	        }

	        let value = update.Value
	        if (value === null || value === undefined) {
	          throw new InvalidTransaction('Value is required')
	        }

	        let parsed = parseInt(value)
	        if (parsed !== value || parsed < MIN_VALUE || parsed > MAX_VALUE) {
	          throw new InvalidTransaction(
	            `Value must be an integer ` +
	            `no less than ${MIN_VALUE} and ` +
	            `no greater than ${MAX_VALUE}`)
	        }

	        value = parsed
	        
	        
	        const _depositToWallet = _applyOperator('inc', (x, y) => x + y)
	        const _withdrawFromWallet = _applyOperator('dec', (x, y) => x - y)

	        // Determine the action to apply based on the verb
	        let actionFn
	        if (action === 'createwallet') {
	          actionFn = _createWallet
	        } else if (action === 'deposittowallet') {
	          actionFn = _depositToWallet
	        } else if (action === 'withdrawfromwallet') {
	          actionFn = _withdrawFromWallet
	        }  else if (action === 'displaywallet') {
	          actionFn = _displayWallet
	        }else {
	          throw new InvalidTransaction(`Didn't recognize Action "${action}".\nMust be "createwallet", "deposittowallet", or "withdrawfromwallet",or "displaywallet"`)
	        }

	        let address = TP_NAMESPACE + _hash(name).slice(-64)

	        // Get the current state, for the key's address:
	        let getPromise = context.getState([address])

	        // Apply the action to the promise's result:
	        let actionPromise = getPromise.then(
	          actionFn(context, address, name, value)
	        )

	        // Validate that the action promise results in the correctly set address:
	        return actionPromise.then(addresses => {
	         /* if (addresses.length === 0) {
	            throw new InternalError('State error!')
	          }*/
	          console.log(`Verb: ${action}\nName: ${name}\nValue: ${value}`)
	          logger.info("Action result is ");
	        })
	      })
	  }
	}

	module.exports = WalletHandler
