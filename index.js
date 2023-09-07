const express=require('express');
const app=express();
const port=8000;
const mongoose=require('mongoose');
const db= require('./config/mongoose')
const registerschema=require('./model/register')
const bodyParser = require('body-parser');
const User=require('./model/user')
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
app.set('view engine', 'ejs');
// app.use(express.urlencoded({ extended: true }));
app.use(express.static('./views'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const bcrypt = require('bcrypt');
app.get('/',(req,res)=>{
    res.render('home')
    
})
app.get('/register',(req,res)=>{
res.render('SignUp')
})



app.use(session({
  secret: 'My-key',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      const user = await User.findOne({ email });

      if (!user) {
        return done(null, false, { message: 'User not found.' });
      }

      const match = await bcrypt.compare(password, user.password);

      if (match) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Incorrect password.' });
      }
    } catch (error) {
      return done(error);
    }
  }
));


passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

//  middleware to check if the user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/login'); 
  }
};


app.get('/change-password', (req, res) => {
  if (req.isAuthenticated() && req.user) {
    res.render('change-password');
  } else {
    res.redirect('/login');
  }
});

app.post('/change-password', isAuthenticated, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;


    if (newPassword !== confirmPassword) {
      return res.send('New password and confirm password do not match.');
    }


    const user = req.user;


    const isPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.send('Current password is incorrect.');
    }


    const hashedPassword = await bcrypt.hash(newPassword, 10);


    user.password = hashedPassword;
    await user.save();

    res.send('Password updated successfully.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});



app.get('/', (req, res) => {
  res.render('home');
});

app.get('/register', (req, res) => {
  res.render('SignUp');
});

app.get('/login', (req, res) => {
  res.render('logOut');
});

app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (user) {
      return res.send('User already exists. Please log in.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      password: hashedPassword,
    });

    await newUser.save();
    console.log('User registered successfully!');
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
  
    if (err) {
      console.error(err);
      return res.status(500).send('Server Error');
    }
    if (!user) {
     
      return res.send('Authentication failed: ' + info.message);
    }

    req.logIn(user, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Server Error');
      }
   
      res.render('profile', { email: user.email });
    });
  })(req, res, next);
});



app.get('/logout', (req, res) => {
  req.logout();
  console.log('Logged out successfully');
  res.redirect('/');
});




app.listen(port, () => {
  console.log('Server created successfully');
});