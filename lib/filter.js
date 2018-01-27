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
                        if(value == "hasMany")
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
            }
        }
    }
    module.exports = app;
})();