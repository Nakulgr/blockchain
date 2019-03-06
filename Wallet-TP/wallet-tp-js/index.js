/**
 * Copyright 2016 Intel Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ------------------------------------------------------------------------------
 */

const { TransactionProcessor } = require('sawtooth-sdk/processor')

const WalletHandler = require('./wallet_handler')
const env = require('./env')

var logger = require('./logger').Logger;

const transactionProcessor = new TransactionProcessor(env.validatorUrl)

transactionProcessor.addHandler(new WalletHandler())
transactionProcessor.start()


console.log(`Starting wallet transaction processor`)
console.log(`Connecting to Sawtooth validator at ${env.validatorUrl}`)
logger.info(`Starting wallet transaction processor`)
logger.info(`Connecting to Sawtooth validator at ${env.validatorUrl}`)

