'use strict';
(function() {
    var app = function(Firebase){
        return {
            include : function(data, includeArray, relations, cb)
            {
                const asyncLoop = require('node-async-loop');
                var firebaseInclude    = new Array();
                var firebaseRelation   = new Array();
                var firebaseForeignKey = new Array();
                var index              = -1;
                var indexRelation      = -1;
                var newDate            = new Array()

                for(var k in includeArray)
                {
                    if(relations[includeArray[k]])
                    {
                        if(relations[includeArray[k]].model)
                        {
                            firebaseInclude.push(relations[includeArray[k]].model)
                        }
                        if(relations[includeArray[k]].type)
                        {
                            firebaseRelation.push(relations[includeArray[k]].type)
                        }
                        if(relations[includeArray[k]].foreignKey)
                        {
                            firebaseForeignKey.push(relations[includeArray[k]].foreignKey)
                        }
                    }

                    else
                    {
                        for(var y in relations)
                        {   
                            if(relations[y])
                            {
                                if(relations[y].model)
                                {
                                    firebaseInclude.push(relations[y].model)
                                }
                                if(relations[y].type)
                                {
                                    firebaseRelation.push(relations[y].type)
                                }
                                if(relations[y].foreignKey)
                                {
                                    firebaseForeignKey.push(relations[y].foreignKey)
                                }
                            }
                        }
                    }
                }
                asyncLoop(data, function (d, next)
                {

                    index ++;

                    asyncLoop(firebaseRelation, function(value, next2)
                    {
                        if(value == "belongsTo")
                        {
                            indexRelation++

                            var ref = Firebase.ref(firebaseInclude[indexRelation])
                            ref
                            .orderByChild("id")
                            .equalTo(d[firebaseForeignKey[indexRelation]])
                            .once('value', function(snapshot)
                            {
                                if(snapshot)
                                {   
                                    var dataSnapshot = new Array();
                                    
                                    for(var y in snapshot.val())
                                    {   
                                        dataSnapshot.push(snapshot.val()[y])
                                    }
        
                                    try {
                                        data[index]["_"+firebaseInclude[indexRelation]] = dataSnapshot
                                    } catch (error) {
                                        console.log(error)                                        
                                    }
                                }
                                next2()
                            })
                        }
                        if(value == "hasMany" || value == "hasOne")
                        {
                            indexRelation++

                            var ref = Firebase.ref(firebaseInclude[indexRelation])
                            ref
                            .orderByChild(firebaseForeignKey[indexRelation])
                            .startAt(d.id)
                            .endAt(d.id)
                            .once('value', function(snapshot)
                            {
                                if(snapshot)
                                {
                                    var dataSnapshot = new Array();
                                    
                                    
                                    for(var y in snapshot.val())
                                    {   
                                        dataSnapshot.push(snapshot.val()[y])
                                    }
        
                                    try {
                                        data[index]["_"+firebaseInclude[indexRelation]] = dataSnapshot
                                    } catch (error) {
                                        console.log(error)                                            
                                    }

                                }
                                next2()
                            })
                        }
                        
                    },
                    function(err)
                    {
                        if (err)
                        {
                            console.error('Error: ' + err.message);
                            return;
                        }

                        indexRelation = -1;
                        next()
                    })
                    
                }, function (err)
                {
                    if (err)
                    {
                        console.error('Error: ' + err.message);
                        return;
                    }
                    
                    cb(err, data)
                })
            },
            paginationCount : function(model, pagination, cb){

                //global.firebase.auth().currentUser.getIdToken().then(token => console.log(token)); 

                //console.log(model, pagination)
                var axios = require('axios');
                var auth_key = global.firebase['repo_']['persistentConnection_']['authTokenProvider_']['app_']['options_']['credential']['certificate_'];

                var url   = 'https://paterx-development.firebaseio.com/'+model+'.json';

                var url2 = 'https://docs-examples.firebaseio.com/rest/saving-data/auth-example.json?auth='+auth_key

                if(pagination.shallow !== undefined)
                {
                    if(pagination.shallow == true)
                    {
                        url+='?shallow=true&access_token='+JSON.stringify(auth_key);
                    }
                }
                else{
                    url+'&access_token='+JSON.stringify(auth_key)
                }

                console.log(url)

                
                // var namesRef = new Firebase('https://paterx-development.firebaseio.com/Taxe.json');
                axios.get(url)
                .then(function (res) {
                    console.log(res)
                    // var count = 0, breakPag = 0, config = {}, filtered = {};

                    // if(pagination.where !== undefined)
                    // {
                    //     for(var d in res.data)
                    //     {
                    //         var data = where(res.data[d])
                    //         if(Object.keys(data).length !== 0)
                    //         {
                    //             filtered[d] = data
                    //         }
                    //     }
                    // }

                    // function where(data){

                    //     var isValid = [], countIsValid = 0;
                    //     for(var i in pagination.where)
                    //     {
                    //         countIsValid++;
                    //         if(data[i] === pagination.where[i])
                    //         {
                    //             isValid.push(true)
                    //         }
                    //     }
                    //     if(isValid.length === countIsValid)
                    //     {
                    //         return data
                    //     }
                    //     return {}
                    // }

                    // for(var k in filtered)
                    // {
                    //     count ++
                    //     breakPag ++
                    // }

                    // config["count"] = count
                    // config["pag"]   = Math.ceil(count / pagination.pag)

                    // cb(null, config)
                    // var keys = Object.keys(res.data).sort(); // Notice the .sort()!
                    // var pageLength = 2;
                    // var pageCount = keys.length / pageLength;
                    // var currentPage = 1;
                    // var promises = [];
                    // var nextKey;
                    // var query;

                    // for (var i = 0; i < pageCount; i++) {
                    // key = keys[i * pageLength];
                    // console.log('key', key);
                    // query = namesRef.orderByKey().limitToFirst(pageLength).startAt(key);
                    // promises.push(query.once('value'));
                    // }

                    // Promise.all(promises)
                    // .then(function (snaps) {
                    //     var pages = [];
                    //     snaps.forEach(function (snap) {
                    //     pages.push(snap.val());
                    //     });
                    //     console.log('pages', pages);
                    //     process.exit();
                        
                    // });
                })
                .catch(function(err){
                    console.log(err)
                })
            },
            paginationFormat : function(options, data, cb){
                console.log(options)

                // if(pagination.where !== undefined)
                //     {
                //         for(var d in res.data)
                //         {
                //             var data = where(res.data[d])
                //             if(Object.keys(data).length !== 0)
                //             {
                //                 filtered[d] = data
                //             }
                //         }
                //     }

                //     function where(data){

                //         var isValid = [], countIsValid = 0;
                //         for(var i in pagination.where)
                //         {
                //             countIsValid++;
                //             if(data[i] === pagination.where[i])
                //             {
                //                 isValid.push(true)
                //             }
                //         }
                //         if(isValid.length === countIsValid)
                //         {
                //             return data
                //         }
                //         return {}
                //     }
            }
        }
    }
    module.exports = app;
})();