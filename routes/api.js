/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
const ThreadController = require( '../controllers/handlers');



module.exports = function (app) {
  
  app.route('/api/boards')
  .get(function (req, res){
    ThreadController.getThreadName(req, res, function(err, record){
      res.json(record);
    })   
  })
  
  
  app.route('/api/threads/:board')
  .post(function (req, res){
    ThreadController.postThread(req, res, function(err, res){
      if(err) return console.log('Controller err: '+err);
    })  
    res.redirect('/b/'+req.params.board+'/');
  })
  
  .get(function (req, res){
    ThreadController.getTenThread(req, res, function(err, record){
      res.json(record) 
    })
  })
  
  .delete(function (req, res){
    ThreadController.deleteOneThread(req, res, function(err, message){
      if(err) return console.log('Controller err: '+err);
      console.log("message", message)
      res.send(message)
    })  
    
  })

  .put(function (req, res){
    ThreadController.reportThread(req, res, function(err, message){
      if(err) return console.log('Controller err: '+err);
      res.send(message)
    })  
  })


  
  
    
  app.route('/api/replies/:board')
    .post(function (req, res){
    ThreadController.postReplay(req, res, function(err, res){
      if(err) return console.log('Controller err: '+err);
    })  
    res.redirect(`/b/${req.params.board}/${req.body.thread_id}`);
  })
  
   .get(function (req, res){
    ThreadController.getEntireThread(req, res, function(err, record){
      res.json(record) 
    })
  })
  
   .delete(function (req, res){
    ThreadController.deletePost(req, res, function(err, message){
      if(err) return console.log('Controller err: '+err);
      res.send(message)
    })  
  })
   
  .put(function (req, res){
    ThreadController.reportReplay(req, res, function(err, message){
      if(err) return console.log('Controller err: '+err);
      res.send(message)
    })  
  })



};
