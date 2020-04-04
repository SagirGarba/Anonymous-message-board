var exports = module.exports = {};
const MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
const CONNECTION_STRING = process.env.DB



 exports.getThreadName = function(req, res, callback){
    MongoClient.connect(CONNECTION_STRING, {useNewUrlParser: true}, function(err, client){
      if(err){console.log("Database error: : " + err)}
      console.log("MongoClient connected successfully")
      var threadNames=[]
      var db = client.db("MessageBoard");
      db.listCollections().toArray(function(err, items) {
        items.forEach(thread=>threadNames.push(thread.name))
          callback( null, threadNames);
      
      });
  })

 }

//Post new thread
exports.postThread = function(req, res, callback){
  var board = req.params.board
  var threadText = req.body.text
  var passwordToDelete = req.body.delete_password
  var newThread = {
    _id: ObjectId(),
    text: threadText,
    created_on : new Date(),
    bumped_on : new Date(),
    reported :false,
    delete_password : passwordToDelete,
    replies: []
  }


  MongoClient.connect(CONNECTION_STRING, {useNewUrlParser: true}, function(err, client){
    if(err){console.log("Database error: : " + err)}
    console.log("MongoClient connected successfully")
    var db = client.db("MessageBoard");
    db.collection(board).insertOne(newThread, (err, docs)=>{
      if (err){
        console.log("Database error: : " + err);
      };
      callback( null, docs);
    })
  })  
}

//Post new reply
exports.postReplay = function(req, res){

  var board = req.params.board
  var thread_id = req.body.thread_id
  var threadText = req.body.text
  var passwordToDelete = req.body.delete_password
  var replyThread = {
    $set: {bumped_on : new Date()},
    $push: {replies: {_id: new ObjectId(),
                      text: threadText,
                      created_on : new Date(),
                      delete_password : passwordToDelete,
                      reported :false}
           }
  }
  
  MongoClient.connect(CONNECTION_STRING, {useNewUrlParser: true}, function(err, client){
    if(err){console.log("Database error: : " + err)}
    console.log("MongoClient connected successfully")
    
    var db = client.db("MessageBoard");
    db.collection(board).findOneAndUpdate({_id: new ObjectId(thread_id)}, replyThread, (err, docs)=>{
      if (err){
        console.log("Database error: : " + err);
      };
      // console.log("reply", docs)

    })
  })  
}


//get most recent 10 bumped threads
exports.getTenThread = function(req, res, callback){
  var board = req.params.board 
  
  MongoClient.connect(CONNECTION_STRING, {useNewUrlParser: true}, function(err, client){
    if(err){console.log("Database error: : " + err)}
    console.log("MongoClient connected successfully")
    var db = client.db("MessageBoard");
    db.collection(board).find({},{limit: 10, sort: [['bumped_on', -1]]}).project( { reported: 0, delete_password: 0} ).toArray((err, docs)=>{
      if (err){
        console.log("Database error: : " + err);
      };

      var record = docs.map((d)=>{
        d.replyCount = d.replies.length
        console.log(d.replyCount)
        d.replies = d.replies.slice(d.replies.length>=3 ? -3 : -d.replies.length)
        return d
      })
      console.log("p",record)
      callback( null, record);
      
    });  
  })  
}

//get entire thread with all its replies
exports.getEntireThread = function(req, res, callback){
  var board = req.params.board
  var thread_id = req.query.thread_id
  MongoClient.connect(CONNECTION_STRING, {useNewUrlParser: true}, function(err, client){
    if(err){console.log("Database error: : " + err)}
    console.log("MongoClient connected successfully")
    var db = client.db("MessageBoard");
    db.collection(board).findOne({_id: new ObjectId(thread_id)}, (err, docs)=>{
      if (err){
        console.log("Database error: : " + err);
      };
      if(docs){
        delete docs.reported;
        delete docs.delete_password;
        docs.replies = docs.replies.map( item => 
                                        {delete item.reported; 
                                        delete item.delete_password; 
                                        return item;})
      }
      callback( null, docs);
    })
  })   

}

//delete a thread completely
exports.deleteOneThread = function(req, res, callback){
  var board = req.params.board
  var thread_id = req.body.thread_id
  var passwordToDelete = req.body.delete_password
  MongoClient.connect(CONNECTION_STRING, {useNewUrlParser: true}, function(err, client){
    if(err){console.log("Database error: : " + err)}
    console.log("MongoClient connected successfully")
    var db = client.db("MessageBoard");
    
    db.collection(board).findOne({_id: new ObjectId(thread_id)}, (err, docs)=>{
      if (err){
        console.log("Database error: : " + err);
      };

      if(docs==null){
        var message = "incorrect thread_id"
        callback( null, message);
      }else{
        if(docs.delete_password == passwordToDelete){
        var message = "success"
        callback( null, message);
      }else{
        var message = "incorrect password"
        callback( null, message);
      }
      }
      
      if(message == "success"){
            db.collection(board).deleteOne({_id: new ObjectId(thread_id), delete_password:passwordToDelete }, (err, docs) => {
              if (err){
                console.log("Database error: : " + err);
                };
              console.log("successfully deleted")
              });
        }
      });
    });
  }

exports.deletePost = function(req, res, callback){
  var board = req.params.board
  var thread_id = req.body.thread_id
  var reply_id = req.body.reply_id
  var password = req.body.delete_password
  var passwordmatch = 0
  MongoClient.connect(CONNECTION_STRING, {useNewUrlParser: true}, function(err, client){
    if(err){console.log("Database error: : " + err)}
    console.log("MongoClient connected successfully")
    var db = client.db("MessageBoard");  
    db.collection(board).findOne({_id: new ObjectId(thread_id)}, (err, docs)=>{
      if (err){
        console.log("Database error: : " + err);
      };

      if(docs==null){
        var message = "incorrect thread_id"
        callback( null, message);
      }else{
        let index = docs.replies.findIndex( elem => elem._id == reply_id);
        console.log("o",index)
        if(index === -1) {
          message = 'incorrect reply_id'
          callback( null, message); 
        }else{
          console.log(docs.replies[index].delete_password)
          if(docs.replies[index].delete_password != password) {
            message = 'incorrect password'
            callback( null, message); 
        }else{
       console.log(new ObjectId(thread_id))
      console.log(new ObjectId(reply_id))
        db.collection(board).updateOne({_id: new ObjectId(thread_id)},{ $pull: {replies:{_id: new ObjectId(reply_id)}}} , (err, docs)=>{
            if (err){
                console.log("Database error: : " + err);
                }; 
          message = 'success'
          callback( null, message);  
          console.log("success")    
          });
        }
        }     
      }    
    });
  });
}

exports.reportThread = function(req, res, callback){
  var thread_id = req.body.thread_id
  console.log("rep", thread_id)
  var board = req.params.board
  MongoClient.connect(CONNECTION_STRING, {useNewUrlParser: true}, function(err, client){
    if(err){console.log("Database error: : " + err)}
    console.log("MongoClient connected successfully")
    var db = client.db("MessageBoard");  
      
    db.collection(board).updateOne({ _id: new ObjectId(thread_id) },{ $set: {  reported: true } },function(err, docs){
        if(err) return console.log('Database updateOne err: '+err);
      
        if(docs.matchedCount ==0){
        var message = "incorrect thread_id"
        callback( null, message);
      }else{
        var message = "success"
        callback( null, message);
      }
        });
      
    });
  };

exports.reportReplay = function(req, res, callback){
  var thread_id = req.body.thread_id
  var board = req.params.board
  var reply_id = req.body.reply_id
  console.log("rep", reply_id)
  MongoClient.connect(CONNECTION_STRING, {useNewUrlParser: true}, function(err, client){
    if(err){console.log("Database error: : " + err)}
    console.log("MongoClient connected successfully")
    var db = client.db("MessageBoard");  
      
    db.collection(board).updateOne({ _id: new ObjectId(thread_id), "replies._id": ObjectId(reply_id) },{ $set: { "replies.$.reported": true } },function(err, docs){
        if(err) return console.log('Database updateOne err: '+err);
        if(docs.matchedCount ==0){
        var message = "incorrect thread_id"
        callback( null, message);
      }else{
        var message = "success"
        callback( null, message);
      }
        });
      
    });
  };