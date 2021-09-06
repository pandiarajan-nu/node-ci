/*
 * File: cache.js
 * Project: server
 * Created Date: Monday, September 6th 2021, 4:42:35 pm
 * Author: Pandiarajan <pandiarajan.rajagopal@nutechnologyinc.com>
 * -----
 * Last Modified: Monday September 6th 2021 4:42:35 pm
 * Modified By: Pandiarajan <pandiarajan.rajagopal@nutechnologyinc.com>
 * -----
 * Copyright (c) 2021 All rights reserved
 * ------------------------------------
 */

const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');
const keys = require('../config/keys');

const client = redis.createClient(keys.redisUrl);
client.hget = util.promisify(client.hget);
const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function(options = {}) {
    this._cache = true;
    this._hashKey = JSON.stringify(options.key || '');

    return this;
}

mongoose.Query.prototype.exec = async function() {
    if (!this._cache) {
        return exec.apply(this, arguments);
    }

    const key = JSON.stringify(
        Object.assign({}, this.getQuery(), {
          collection: this.mongooseCollection.name
        })
    );

    const cachedValue = await client.hget(this._hashKey, key);

    console.log('FROM CACHE', cachedValue);

    if (cachedValue) {
        const doc = JSON.parse(cachedValue);

        return Array.isArray(doc)
            ? doc.map(d => new this.model(d))
            : new this.model(doc);
    }

    console.log('FROM MONGO')

    const result = await exec.apply(this, arguments);

    client.hset(this._hashKey, key, JSON.stringify(result));

    return result;
}