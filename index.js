
var Core = require('core.constructor');
var express = require('express');
var app = express();

var users = [];

var core = new Core({
    name: 'core.server',
    plugins: [
        require('core.plugin.uuid'),
        require('core.plugin.hash'),
    ],
    extend: {
        express,
        app,
        config: {
            authHeader: 'authtoken',
            logError(err){
                console.log(err);
            },
            onError(req, res, next){
                res.status(req.error && req.error.status || 500);
                res.json(req.error);
                core.config.logError(req.error)
            },
            setUser(user){
                users = users.map(user => {
                    let id = user._id || user.id || user.email;
                });
            },
            getUser(properties, callback){
                callback(null, users.find(properties => {
                    for(var m in properties){
                        if(user[m] !== properties[m]){ return; }
                    }
                    return true;
                }));
            },
            onUnauthorized(req, res, next){
                res.status(401);
                res.json({ message: req.message });
            },
            
            onLogin(req, res, next){

            },
            onAuthenticate(req, res, next){
    
            },
            onLogout(req, res, next){
                
            },
        },
        setConfig(config){
            Object.assign(core.config, config);
        },
        
        middlewares: {
            validate(req, res, next){
                req.validate = function(obj, cb){
                    var type;
                    for(var m in obj){
                        type = core.typeOf(req.body[m]);
                        if(type === 'undefined'){
                            res.status(422);
                            return res.json({ error: `parameter "${m}" is missing`, key: m });
                        }
                        if(type !== obj[m]){
                            res.status(422);
                            return res.json({ error: `parameter "${m}" should be of type "${obj[m]}". got "${type}".`, key: m });
                        }
                    }
                    cb(req.body);
                }
                next();
            },
            error(req, res, next){
                res.error = function(error){
                    if(!err){ return; }
                    req.error = error;
                    core.config.onError(req, res, next);
                    return true;
                }
                next();
            },
            user(req, res, next){
                var token = req.headers[core.configuration.authHeader];
                if(!token){
                    res.message = 'token is missing';
                    return core.config.onUnauthorized(req, res, next);
                }
                core.config.getUser({ token: token }, function(err, existingUser){
                    if(err){
                        return res.error({ error: err, message: 'Unauthorized' });
                    }
                    if(!existingUser){
                        res.message = 'token expired';
                        return core.config.onUnauthorized(req, res, next);
                    }
                    req.user = existingUser;
                    next();
                });
            }
        },

        validations: {
            email(email) {
                var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                return re.test(email);
            }
        },
        
        createUser(user){

            var salt = core.uuid();
            var token = core.uuid();

            return Object.assign({}, user || {}, {
                password: core.hash(password + salt),
                createdAt: new Date().toISOString(),
                salt,
                token
            })
        },
        
        
        
        use(){
            var args = [].slice.call(arguments);
            var name = args.shift();
            var validation;
            args = args.filter(item => {
                if(core.isObject(item)){
                    validation = item;
                    return false;
                }
                return true;
            });
            if(validation){
                console.log('1');
                args.unshift((req, res, next) => {
                    console.log('2');
                    req.validate(validation, function(body){
                        console.log('3');
                        next();
                    });
                });
            }
            args.unshift(name, express.json(), core.middlewares.validate, core.middlewares.error);
            return app.use.apply(app, args)
        }
    }
});

module.exports = core;