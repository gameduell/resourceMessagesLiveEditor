var passport = require('passport'),
    LdapStrategy = require('passport-ldapauth').Strategy,
    fs = require('fs');

/*

    Please note: this module expects that the following middlewares are used by express (on the default route):
    - bodyParser (for parsing the form body when POSTing to /login)
    - cookieParser (for parsing the session cookie on each request)
 */

passport.use(new LdapStrategy({
    server: {
        url: 'ldaps://gdoffice.gameduell.de:3269',
        bindDn: 'CN=trac-bind-user,CN=Users,DC=gdoffice,DC=gameduell,DC=de',
        bindCredentials: 'rGt2EJuY',
        searchBase: 'ou=people,DC=gdoffice,DC=gameduell,DC=de',
        searchFilter: '(sAMAccountName={{username}})',
        tlsOptions: {
            ca: [
                fs.readFileSync('gameduellCA.crt')
            ]
        }
    }
}));

// we need the next 2 functions if we want to use passport sessions
// what is passed to done as the 2nd parameter gets serialized
passport.serializeUser(function(user, done) {
    done(null, user);
});
passport.deserializeUser(function(user, done) {
    done(null, user);
});

module.exports = function (app) {

    app.use(require('express-session')({
            name: 'translatron_session',
            // secret is used for signing the cookie so that nobody can create fake cookies
            secret: 'joker',
            // if true session would be updated (in store) on every request (even without changes to session) and
            // recommended default is false, anyway
            resave: false,
            // see https://github.com/expressjs/session#user-content-saveuninitialized
            saveUninitialized: false
        })
    );
    app.use(passport.initialize());
    app.use(passport.session());

    // if login is successful, the user info will be saved in a connect.sid cookie
    app.post('/login',
        passport.authenticate('ldapauth', {
            session: true,
            // not optimal - so we will loose the Referer after wrong login
            failureRedirect : '/?failure=true'
        }),
        function(req, res) {
            var backURL = req.header('Referer') || '/';

            if (req.body.from && req.body.from.length > 0) {
                backURL += req.body.from;
            }

            res.redirect(backURL);
        }
    );

    // logout - page reload is handled on client side
    app.post('/logout', function(req, res) {
        req.logout();
        res.send('logout');
    });

    return function (res, req, next) {
        next();
    }
};