'use strict';
(function() {
    var app = function(Firebase){
        return {
            include : function(data, includeArray, relations, cb)
            {
                const asyncLoop = require('node-async-loop');
                var firebaseInclude;
                var firebaseRelation;
                var firebaseForeignKey;
                var index = -1;
                var newDate = new Array()

                for(var k in relations)
                {
                    firebaseInclude    = relations[k]["model"]
                    firebaseRelation   = relations[k]["type"]
                    firebaseForeignKey = relations[k]["foreignKey"]
                }

                asyncLoop(data, function (d, next)
                {
                    if(firebaseRelation == "belongsTo")
                    {
                        var ref = Firebase.ref(firebaseInclude)
                        ref
                        .orderByChild("id")
                        .equalTo(d[includeArray[0]])
                        .on('value', function(snapshot)
                        {
                            if(snapshot)
                            {   
                                var dataSnapshot = new Array();
                                index ++;
                                
                                for(var y in snapshot.val())
                                {   
                                    dataSnapshot.push(snapshot.val()[y])
                                }
    
                                data[index]["_"+firebaseInclude] = dataSnapshot
                            }
                            next()
                        })
                    }
                    if(firebaseRelation == "hasMany")
                    {
                        var ref = Firebase.ref(firebaseInclude)
                        ref
                        .orderByChild(firebaseForeignKey)
                        .startAt(d["id"])
                        .endAt(d["id"])
                        .on('value', function(snapshot)
                        {
                            if(snapshot)
                            {   
                                var dataSnapshot = new Array();
                                index ++;
                                
                                for(var y in snapshot.val())
                                {   
                                    dataSnapshot.push(snapshot.val()[y])
                                }
    
                                data[index]["_"+firebaseInclude] = dataSnapshot
                            }
                            next()
                        })
                    }
                    
                }, function (err)
                {
                    if (err)
                    {
                        //console.error('Error: ' + err.message);
                        return;
                    }
                    
                    cb(err, data)
                })
            }
        }
    }
    module.exports = app;
})();