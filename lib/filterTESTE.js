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
                    // if(relations[includeArray[k]].type)
                    // {
                    //     firebaseRelation.push(relations[includeArray[k]].type)
                    // }
                    // if(relations[includeArray[k]].foreignKey)
                    // {
                    //     firebaseForeignKey.push(relations[includeArray[k]].foreignKey) 
                    // }
                }

                //console.log(includeArray)
                //console.log(relations)
                console.log(firebaseInclude)
                console.log(firebaseRelation)
                console.log(firebaseForeignKey)
                //throw true

                asyncLoop(data, function (d, next)
                {
                    asyncLoop(firebaseRelation, function(value, next2)
                    {
                        if(value == "belongsTo")
                        {
                            indexRelation++

                            var ref = Firebase.ref(firebaseInclude[indexRelation])
                            ref
                            .orderByChild("id")
                            .equalTo(d[firebaseForeignKey[indexRelation]])
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
        
                                    data[index]["_"+firebaseInclude[indexRelation]] = dataSnapshot
                                }
                                next2()
                            })
                        }
                        if(value == "hasMany")
                        {
                            indexRelation++
                            console.log("================sdsddsdsd========================")
                            console.log(firebaseInclude[indexRelation])
                            console.log(firebaseForeignKey[indexRelation])
                            console.log(d)
                            //throw true

                            var ref = Firebase.ref(firebaseInclude[indexRelation])
                            ref
                            .orderByChild(firebaseForeignKey[indexRelation])
                            .startAt(d.id)
                            .endAt(d.id)
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
        
                                    data[index]["_"+firebaseInclude[indexRelation]] = dataSnapshot
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

