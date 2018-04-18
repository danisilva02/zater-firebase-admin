/**
 * Created with JetBrains WebStorm.
 * User: kamol
 * Date: 3/19/15
 * Time: 2:41 PM
 * To change this template use File | Settings | File Templates.
 */

var Connector = require('loopback-connector').Connector,
    util = require('util'),
    async = require('async'),
    models,
    admin = require("firebase-admin"),
    google = require("googleapis");

var NAME = 'firebase';

var client, serviceAccount;
/**
* Constructor for FirebaseDB connector
* @param {Object} settings The settings object
* @param {DataSource} dataSource The data source
* instance
* @constructor
*/
var FirebaseDB = function (dataSource) {
  if (!(this instanceof FirebaseDB)) {
    return new FirebaseDB(dataSource);
  }

  if (dataSource.hasOwnProperty("definitions")) {
    models = dataSource.definitions
  }

  serviceAccount = dataSource.settings;

  Connector.call(this, NAME, dataSource.settings);

  this.name = NAME;
  this.settings = dataSource.settings;
};

util.inherits(FirebaseDB, Connector);
FirebaseDB.prototype.relational = true;
/**
* Get the default data type for ID
* @returns {Function} The default type for ID
*/
FirebaseDB.prototype.getDefaultIdType = function () {
  return String;
};
/**
* Connect to the Database
* @param callback
*/
FirebaseDB.prototype.connect = function (callback) {

  console.log("INIT DATABASE");

  var config = {
    credential: admin.credential.cert(serviceAccount.serviceAccount),
    databaseURL: serviceAccount.databaseURL,
  }

  if (serviceAccount.databaseAuthVariableOverride) {
    config["databaseAuthVariableOverride"] = {
      uid: serviceAccount.databaseAuthVariableOverride
    }
  }

  // var scopes = [
  //   "https://www.googleapis.com/auth/userinfo.email",
  //   "https://www.googleapis.com/auth/firebase.database"
  // ];

  // var jwtClient = new google.auth.JWT(
  //   serviceAccount.serviceAccount.client_email,
  //   null,
  //   serviceAccount.serviceAccount.private_key,
  //   scopes
  // );

  // jwtClient.authorize(function(error, tokens) {
  //   if (error) {
  //     console.log("Error making request to generate access token:", error);
  //   } else if (tokens.access_token === null) {
  //     console.log("Provided service account does not have permission to generate access tokens");
  //   } else {
  //     console.log(tokens.access_token)
  //     var accessToken = tokens.access_token;
  //     // See the "Using the access token" section below for information
  //     // on how to use the access token to send authenticated requests to
  //     // the Realtime Database REST API.
  //   }
  // });

  // Promise.resolve(
    admin.initializeApp(config)
  // )
  // .then(function(res){
    //
    client = admin.database();

    global.firebase = client;

    // var FirebaseTokenGenerator = require("firebase-token-generator");
    // var tokenGenerator = new FirebaseTokenGenerator("636e4dcadd76b56117c3caba8338eba02f78368f");
    // var token = tokenGenerator.createToken({ uid: "admin", some: "arbitrary", data: "here" });
    // console.log(token)

    // var request = require('request');

    // var jwtClient = new google.auth.JWT(serviceAccount.serviceAccount.client_email, null, serviceAccount.serviceAccount.private_key, [
    //   'https://www.googleapis.com/auth/userinfo.email',
    //   'https://www.googleapis.com/auth/firebase.database'
    // ]);

    // console.log(jwtClient)

    // jwtClient.authorize(function(err, tokens) {
    //   request({
    //     url     : 'https://paterx-development.firebaseio.com/.json',
    //     method  : 'GET',
    //     headers : {
    //       'Authorization': 'Bearer ' + tokens.access_token
    //     }
    //   }, function(err, resp) {
    //     console.log(resp.body);
    //   });
    // });

    // admin.auth().getUser('admin')
    // .then((userRecord) => {
    //   // The claims can be accessed on the user record.
    //   console.log(userRecord.customClaims.admin);
    // }).catch(function(err){
    //   console.log(err)
    // });

    //console.log(admin.auth()['tokenGenerator_']['sessionCookieVerifier']['tokenInfo']['verifyApiName']())

    // admin.auth().createCustomToken(serviceAccount.databaseAuthVariableOverride)
    // .then(function(customToken) {
    //   //console.log(customToken)
    //   global['access-token'] = customToken;
    //   // Send token back to client
    // })
    // .catch(function(error) {
    //   console.log("Error creating custom token:", error);
    // });

    // admin.auth().currentUser.getIdToken(/* forceRefresh */ false).then(function(idToken) {
    //   // Send token to your backend via HTTPS
    //   console.log(idToken)
    //   // ...
    // }).catch(function(error) {
    //   // Handle error
    // });

    // admin.auth().getIdToken().then(token => console.log(token))

    callback(null)  
  // });

  
  
};

FirebaseDB.prototype.getTypes = function onGetTypes() {
  return ['db', 'nosql', 'firebase'];
};

//FirebaseDB.prototype.define = function (model) {
//};

/**
* Create a new model instance
*/
FirebaseDB.prototype.create = function (model, data, callback) {
  var self = this;
  if (!data.id) {
    this.doCreate(model, data, callback);
  } else {
    this.exists(model, data.id, function (err, record) {
      if (err || record) {
        callback(new Error("duplicate create"), data.id);
      } else {
        self.doCreate(model, data, callback);
      }
    });
  }
};

FirebaseDB.prototype.doCreate = function (model, data, callback) {

  var ref = client.ref(model);

  if (!data.id) {
    var newRef = ref.push();
    data.id = newRef.path['pieces_'][1]
    newRef.remove();
  }

  for (var key in data) {
    if (data[key] instanceof Date) {
      data['fbct_' + key] = data[key].toString();
    }
  }

  ref.child(data.id).set(JSON.parse(JSON.stringify(data)), function (err) { callback(err, data.id); });

};
/**
* Save a model instance
*/
FirebaseDB.prototype.save = function (model, data, callback) {
  if (!data.id) {
    callback(new Error("not valid"));
    return;
  }
  for (var key in data) {
    // Save date in translated property.
    if (data[key] instanceof Date) {
      data['fbct_' + key] = data[key].toString();
    }
  }

  var ref = client.ref(model);
  ref.orderByKey().startAt(data.id).endAt(data.id).once('value', function (snapshot) {
    if (snapshot.exists()) {
      ref.child(data.id).update(JSON.parse(JSON.stringify(data)), function (err) { callback(err, data) });
    } else {
      callback(new Error("not valid"));
    }
  });
};
/**
* Check if a model instance exists by id
*/
FirebaseDB.prototype.exists = function (model, id, callback) {

  var ref = client.ref(model);

  ref.orderByKey().startAt(id).endAt(id).once('value',

    function (snapshot) {
      callback(null, snapshot.exists());
    }, function (errorObject) {
      console.log("The read failed: " + errorObject.code);
    });

};

/**
* Find a model instance by id
*/
FirebaseDB.prototype.find = function find(model, id, callback) {
  var ref = client.ref(model);
  var self = this;

  ref.orderByKey().startAt(id).endAt(id).once('value', function (snapshot) {
    var exists = snapshot.val();
    if (exists === null) {
      callback(null);
    } else {

      for (var key in exists[id]) {
        // Convert back to Date object
        if (0 === key.indexOf('fbct_')) {
          exists[id][key.slice(5)] = new Date(exists[id][key]);
          delete exists[id][key];
        }
      }

      var persistUndefinedAsNull = self._models[model].settings.persistUndefinedAsNull;
      if (persistUndefinedAsNull) {
        for (var modelKeys in self._models[model].properties) {
          if (!exists[id][modelKeys]) {
            exists[id][modelKeys] = null;
          }
        }
      }
      callback(null, exists[id]);
    }
  });

};

/**
* Update a model instance or create a new model instance if it doesn't exist
*/
FirebaseDB.prototype.updateOrCreate = function updateOrCreate(model, data, callback) {
  var ref = client.ref(model);
  var self = this;
  if (data && data.id) {
    ref.orderByKey().startAt(data.id).endAt(data.id).once('value', function (snapshot) {
      if (snapshot.exists()) {
        self.save(model, data, function (err, data) { callback(err, data, { isNewInstance: false }); });
      } else {
        self.doCreate(model, data, function (err, id) {
          callback(err, data, { isNewInstance: true });
        });
      }
    });
  } else {
    self.doCreate(model, data, function (err, id) {
      callback(err, data, { isNewInstance: true });
    });
  }
};
/**
* Finds a record or create a new record if it doesn't exist
*/
FirebaseDB.prototype.findOrCreate = function updateOrCreate(model, filter, data, callback) {

  var self = this;
  this.all(model, filter, function (err, result) {
    if (result && result.length > 0) {
      callback = callback || data;
      callback(null, result[0], false);
    } else {
      var objData;
      if (typeof data === 'function') {
        callback = data;
        objData = filter.where;
      }

      self.doCreate(model, objData || data, function (err, res) {
        callback(err, objData || data, true);
      });
    }
  });
};
FirebaseDB.prototype.update =
  FirebaseDB.prototype.updateAll = function (model, where, data, cb) {
    var self = this;
    this.all(model, { where: where }, function (err, result) {
      if (err) {
        cb(err, { count: undefined });
      } else {
        var count = result.length;
        // Update matching records
        _updateModel(self, model, 0, result, data, function (err, affectedCount) {
          cb(err, { count: affectedCount });
        });
      }
    });

  };
/**
* Delete a model instance by id
*/
FirebaseDB.prototype.destroy = function destroy(model, id, callback) {
  // var ref = client.ref(model + '/' + id);
  // ref.remove(callback);
  var idNormalized = typeof id === 'object' && id.inq && id.inq.length > 0 ? id.inq[0] : id;
  var ref = client.ref(model + '/' + idNormalized);
  ref.remove(callback);
};
/**
* Query model instances by the filter
*/
FirebaseDB.prototype.all = function all(model, filter, callback) {
  console.log("FILTER"+filter)
  var pagination = filter;
  var self = this;
  var whereQuery = {};
  var sortDescending = false;
  var toSort, toLimit, toSkip;
  var fieldsArray;
  var relations = models[model].settings.relations;
  var IncludeArray;
  var ref = client.ref(model);
  var newRef = ref;

  var filterKeys = Object.keys(filter);
  if (filterKeys && filterKeys.length > 0) {
    for (var idx = 0; idx < filterKeys.length; idx++) {
      var id = (filter.where && filter.where.id) ? filter.where.id : filter.id;
      // Ignore other Filtering properties as id is unique.
      if (id && typeof id !== 'object') {
        this.find(model, id, function (err, data) {
          if (data) {
            callback(err, [data]);
          } else {
            callback(err, []);
          }
        });
        return;
      }

      if (filterKeys[idx] === 'where') {
        whereQuery = parseWhere(filter.where);
      }

      if (filterKeys[idx] === 'limit') {
        toLimit = filter.limit;
      }
      if (filterKeys[idx] === 'order') {
        var orderSeq = filter.order.split(' ');
        if (orderSeq[1] === 'DESC') {
          sortDescending = true;
        }
        toSort = orderSeq[0];
      }
      if (filterKeys[idx] === 'skip' || filterKeys[idx] === 'offset') {
        toSkip = filter.skip || filter.offset;
      }

      if (filterKeys[idx] === 'fields') {
        fieldsArray = filter.fields;
      }

      if (filterKeys[idx] === 'include') {
        IncludeArray = filter.include;
      }

      if (filterKeys[idx] === 'includes') {
        IncludeArray = filter.includes;
      }
    }
  }

  // Apply where filters
  if (whereQuery.key) {
    var key = whereQuery.key;
    //key = key !== 'order' ? key : (toSort || key);
    newRef = newRef.orderByChild(key);

    if (whereQuery.startAt && typeof whereQuery.startAt !== 'object') {
      newRef = newRef.startAt(whereQuery.startAt);
    }
    if (whereQuery.endAt && typeof whereQuery.endAt !== 'object') {
      newRef = newRef.endAt(whereQuery.endAt);
    }
  }

  newRef.once('value', function (snapshot) {
    
    var values = snapshot.val();

    console.log(whereQuery.pagination)

    if(pagination == true)
    {
      const f = require('./filter')(client)
      f.paginationFormat(filter, values, function (err, pagination) {
        values = pagination;
      })
    }
    else{
      //next()
    }

    function next(){
      
      if (values) {
        var results = [];
        var record;
        for (var key in values) {
          record = values[key];
          var addRecord = undefined;
          var idx;
          // Apply 'and' and 'or' filters
          if (whereQuery.andKeys) {
            addRecord = true;
            for (idx = 0; idx < whereQuery.andKeys.length; idx++) {
              if (record[whereQuery.andKeys[idx]] !== whereQuery.andValues[idx]) {
                if (whereQuery.andValues[idx] !== 'inq') {
                  addRecord = false;
                  break;
                } else if (-1 === whereQuery.inqValues.indexOf(record[whereQuery.andKeys[idx]])) {
                  addRecord = false;
                  break;
                }
              }
            }
          }
          if (whereQuery.orKeys) {
            addRecord = false;
            for (idx = 0; idx < whereQuery.orKeys.length; idx++) {
              if (record[whereQuery.orKeys[idx]] !== whereQuery.orValues[idx]) {
                if (whereQuery.orValues[idx] === 'inq' && -1 !== whereQuery.inqValues.indexOf(record[whereQuery.orKeys[idx]])) {
                  addRecord = true;
                  break;
                }
              } else {
                addRecord = true;
                break;
              }
            }
          }
          // Apply inq filter
          if (addRecord === undefined && whereQuery.inqValues) {
            addRecord = false;
            if (-1 !== whereQuery.inqValues.indexOf(record[whereQuery.key])) {
              addRecord = true;
            }
          }

          // Handle boundary records for 'lt' and 'lt'. Firebase always includes boundaries
          // Handle boolean limiters. Firebase does not handle booleans as expected by dao.
          addRecord = _handleLimits(addRecord, record, whereQuery);

          addRecord = addRecord === undefined ? true : addRecord;
          if (addRecord) {
            // Convert Back to Date
            for (var objKey in record) {
              if (0 === objKey.indexOf('fbct_')) {
                record[objKey.slice(5)] = new Date(record[objKey]);
                delete record[objKey];
              }
            }

            var persistUndefinedAsNull = self._models[model].settings.persistUndefinedAsNull;
            if (persistUndefinedAsNull) {
              for (var modelKeys in self._models[model].properties) {
                if (!record[modelKeys]) {
                  record[modelKeys] = null;
                }
              }
            }

            // Include required fields only
            if (fieldsArray) {
              var filteredRecord = {};
              for (var fieldIdx = 0; fieldIdx < fieldsArray.length; fieldIdx++) {
                filteredRecord[fieldsArray[fieldIdx]] = record[fieldsArray[fieldIdx]];
              }
              results.push(filteredRecord);
            } else {
              results.push(record);
            }
          }
        }

        // Check if we need to sort
        if (toSort) {
          results.sort(function (a, b) {
            if (sortDescending) {
              return b[toSort] > a[toSort] ? 1 : -1;
            }
            return a[toSort] > b[toSort] ? 1 : -1;
          });
        }

        // Check if we need to skip records
        if (toSkip) {
          results = results.slice(toSkip);
        }

        // Check if we need to Limit
        if (toLimit) {
          results = results.slice(0, toLimit);
        }

        if (IncludeArray && relations) {
          const IncludeMedule = require('./filter')(client)

          IncludeMedule.include(results, IncludeArray, relations, function (err, resultsByInclude) {
            callback(err, resultsByInclude);
          })

        }
        else {
          callback(null, results);
        }

      } else {
        callback(null, []);
      }
    }
    
  }, function (err) {
    callback(err, null);
  });
};
/**
* Delete all model instances
*/
FirebaseDB.prototype.destroyAll = function destroyAll(model, data, callback) {
  var self = this;
  if (data && data.id) {
    return this.destroy(model, data.id, callback);
  } else if (callback) {
    var filter = { where: data };
    this.all(model, filter, function (err, result) {
      _deleteMatching(self, model, 0, result, callback);
    });
  } else if (data) {
    callback = data;
    this.count(model, function (err, count) {
      if (err) {
        callback(err);
      } else {
        var ref = client.ref(model);
        ref.remove(function (err) { callback(err, { count: count }); });
      }
    }, {});

  } else {
    callback(new Error('Invalid arguments'));
  }
};
/**
* Count the model instances by the where criteria
*/
FirebaseDB.prototype.count = function count(model, callback, where) {
  // console.log(model)
  // console.log(where)

  const filter = require('./filter')(client)

  filter.paginationCount(model, where.pagination, function (err, pagination) {
    callback(err, pagination);
  })

  // var filter = {where: where};
  //   this.all(model, filter, function(err, result) {
  //   callback(err, result.length);
  // });
};
/**
* Update the attributes for a model instance by id
*/
FirebaseDB.prototype.updateAttributes = function updateAttrs(model, id, data, callback) {
  var self = this;
  var ref = client.ref(model);
  ref.orderByKey().startAt(id).endAt(id).once('value', function (snapshot) {
    if (snapshot.exists()) {
      data.id = id;
      self.save(model, data, callback);
    } else {
      callback(new Error("Not valid"));
    }
  });
};

FirebaseDB.prototype.pagination = function (model, filter, callback) {
  //connector implementation logic 
  callback(null, [{ "id": 1, "name": "hello" }, { "id": 2, "name": "world" }]);
};

/**
* Deletes current record from matching results.
* @param model model name
* @param count current index to update
* @param result matched records
* @param cb callback when all records are updated
* @private
*/
function _deleteMatching(FBConnector, model, count, result, cb) {
  if (result[count]) {
    var id = result[count].id;

    FBConnector.destroy(model, id, function (err, res) {
      if (err) {
        cb(err, { count: count });
      } else {
        _deleteMatching(FBConnector, model, count + 1, result, cb);
      }
    });
  } else {
    cb(null, { count: count });
    return;
  }
}
/**
* Updates current record from matching results with passed new data.
* @param model model name
* @param count current index to update
* @param result matched records
* @param data new data to be updated
* @param cb callback when all records are updated
* @private
*/
function _updateModel(FBConnector, model, count, result, data, cb) {
  if (result[count]) {
    data.id = result[count].id;

    FBConnector.save(model, data, function (err, res) {
      if (err) {
        cb(err, count);
      } else {
        _updateModel(FBConnector, model, count + 1, result, data, cb);
      }
    });
  } else {
    cb(null, count);
    return;
  }
}

function _handleObjectLimits(addRecord, key, keyValue, excludeLimit, record, whereQuery) {

  if (keyValue === null) {
    return false;
  } else {
    keyValue = JSON.parse(JSON.stringify(keyValue));
    if (excludeLimit) {
      if (key === 'startAt') {
        return record[whereQuery.key] > keyValue;
      } else {
        return record[whereQuery.key] < keyValue;
      }
    } else {
      if (key === 'startAt') {
        return record[whereQuery.key] >= keyValue;
      } else {
        return record[whereQuery.key] <= keyValue;
      }
    }
  }

  return addRecord;
}

function _handleLimits(addRecord, record, whereQuery) {
  var limiters = { startAt: whereQuery.startAt, endAt: whereQuery.endAt };
  for (var key in limiters) {
    var excludeLimit = key === 'startAt' ? whereQuery.excludeStart : whereQuery.excludeEnd;

    // Handle null and Objects like Date.
    if (limiters[key] !== undefined && typeof limiters[key] === 'object') {
      return _handleObjectLimits(addRecord, key, limiters[key], excludeLimit, record, whereQuery);
    }

    // Handle Boolean
    if (limiters[key] !== undefined && (excludeLimit || typeof limiters[key] === 'boolean')) {
      if (typeof limiters[key] === 'boolean') {
        var limit = limiters[key];
        if (limit && excludeLimit) {
          if (key === 'startAt') {
            return false;
          } else if (record[whereQuery.key] !== false) {
            addRecord = false;
          }
        } else if (limit && !excludeLimit) {
          if (key === 'startAt' && record[whereQuery.key] !== true) {
            return false;
          } else if (key === 'endAt' && record[whereQuery.key] === undefined) {
            return false;
          }
        } else if (!limit && excludeLimit) {
          if (key === 'startAt' && record[whereQuery.key] !== true) {
            return false;
          } else if (key === 'endAt') {
            return false;
          }
        } else {
          if (key === 'startAt' && record[whereQuery.key] === undefined) {
            return false;
          } else if (key === 'endAt' && record[whereQuery.key] !== false) {
            return false;
          }
        }
      } else {
        if (record[whereQuery.key] === limiters[key]) {
          return false;
        }
      }
    }
  }

  return addRecord;
}

function parseWhere(whereObj) {
  retObj = {};
  for (var key in whereObj) {
    if (typeof whereObj[key] !== 'object') {
      //      // e.g {where: {name: 'xyz'}}
      //      retObj.key = key;
      //      retObj.startAt = whereObj[key];
      //      retObj.endAt = whereObj[key];

      // e.g {where: {name: 'xyz', age:'30'}}
      retObj.andKeys = retObj.andKeys || [];
      retObj.andValues = retObj.andValues || [];
      retObj.andKeys.push(key);
      if (typeof whereObj[key] !== 'object') {
        retObj.andValues.push(whereObj[key]);
      } else {
        propObj = whereObj[key];
        if (propObj.inq) {
          retObj.inqValues = propObj.inq;
          retObj.andValues.push('inq');
        }
      }

    } else if (whereObj[key] instanceof Array) {
      // 'AND'. 'OR' filters
      var propArray = whereObj[key];
      var propLen = propArray.length || 0;
      var prop, idx = 0;

      if (key === 'and') {
        // e.g {where: {and: [{name: 'xyz'}, {role: 'pqr'}]}}
        for (idx = 0; idx < propLen; idx++) {
          retObj.andKeys = retObj.andKeys || [];
          retObj.andValues = retObj.andValues || [];
          for (prop in propArray[idx]) {
            retObj.andKeys.push(prop);
            if (typeof propArray[idx][prop] !== 'object') {
              retObj.andValues.push(propArray[idx][prop]);
            } else {
              propObj = propArray[idx][prop];
              if (propObj.inq) {
                retObj.inqValues = propObj.inq;
                retObj.andValues.push('inq');
              }
            }
          }
        }
      }
      if (key === 'or') {
        // e.g {where: {or: [{name: 'xyz'}, {role: 'pqr'}]}}
        for (idx = 0; idx < propLen; idx++) {
          retObj.orKeys = retObj.andKeys || [];
          retObj.orValues = retObj.andValues || [];
          for (prop in propArray[idx]) {
            retObj.orKeys.push(prop);
            if (typeof propArray[idx][prop] !== 'object') {
              retObj.orValues.push(propArray[idx][prop]);
            } else {
              propObj = propArray[idx][prop];
              if (propObj.inq) {
                retObj.inqValues = propObj.inq;
                retObj.andValues.push('inq');
              }
            }
          }
        }
      }

    } else {
      // 'lt', 'gt' filters
      for (var subkey in whereObj[key]) {
        if (subkey === 'gt' || subkey === 'gte') {
          // e.g {where: {age: {gt: x}}}
          retObj.key = key;
          retObj.startAt = whereObj[key][subkey];
          if (subkey === 'gt') {
            // Firebase always includes endLimiters
            retObj.excludeStart = true;
          }
        }
        if (subkey === 'lt' || subkey === 'lte') {
          retObj.key = key;
          retObj.endAt = whereObj[key][subkey];
          if (subkey === 'lt') {
            retObj.excludeEnd = true;
          }
        }
        if (subkey === 'inq') {
          // e.g {where: {id: {inq: [123, 234]}}}
          retObj.key = key;
          retObj.inqValues = whereObj[key][subkey];
        }

      }
    }
  }

  return retObj;
}
module.exports = FirebaseDB;
