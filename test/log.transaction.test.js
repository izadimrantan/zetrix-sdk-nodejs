'use strict';
require('dotenv').config({path: ".env"});
require('chai').should();
const BigNumber = require('bignumber.js');
const co = require('co');

const ZtxChainSDK = require('../index');

const sdk = new ZtxChainSDK({
  host: process.env.NODE_URL,
});

describe('Test create contract account transaction', function() {

  it('test create contract account ', function() {
    const privateKey = 'private key';
    const sourceAddress = 'ZTX3KepoBV7f7PmjLUF8BZxNydh62r4z8dfm4';

    co(function* () {
      const result = yield sdk.account.getNonce(sourceAddress);

      if (result.errorCode !== 0) {
        console.log(result);
        return;
      }
      let nonce = result.result.nonce;

      nonce = new BigNumber(nonce).plus(1).toString(10);

      let logCreateOperation = sdk.operation.logCreateOperation({
        sourceAddress,
        topic: 'test topic',
        data: 'test data',
        // metadata: '',
      });

      if (logCreateOperation.errorCode !== 0) {
        console.log(logCreateOperation);
        return;
      }

      const operationItem = logCreateOperation.result.operation;

      const args = {
        sourceAddress,
        nonce,
        operations: [operationItem],
        signtureNumber: '100',
        // metadata: 'Test evaluation fee',
      };

      let feeData = yield sdk.transaction.evaluateFee(args);
      if (feeData.errorCode !== 0) {
        console.log(feeData);
        return;
      }

      let feeLimit = feeData.result.feeLimit;
      let gasPrice = feeData.result.gasPrice;

      // 2. build blob
      let blobInfo = sdk.transaction.buildBlob({
        sourceAddress: sourceAddress,
        gasPrice,
        feeLimit,
        nonce: nonce,
        operations: [ operationItem ],
      });

      if (blobInfo.errorCode !== 0) {
        console.log(blobInfo);
        return;
      }

      let blob = blobInfo.result.transactionBlob;

      // 3. sign blob
      let signatureInfo = sdk.transaction.sign({
        privateKeys: [ privateKey ],
        blob,
      });

      if (signatureInfo.errorCode !== 0) {
        console.log(signatureInfo);
        return;
      }

      let signature = signatureInfo.result.signatures;
      // 4. submit transaction
      let transactionInfo = yield sdk.transaction.submit({
        blob,
        signature: signature,
      });

      console.log(transactionInfo);

    }).catch(err => {
      console.log(err);
    });
  });

});
