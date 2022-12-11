const  express = require("express")
const mongoose = require("mongoose")
const User = require("./models")
const Cookie = require("./cookies.models")
const users = require("./models")
const app = express()
const jwt = require('jsonwebtoken')

// listen on port 8001
app.listen(8001, () => {
    console.log("Server running on port 8001")
})


let db = "mongodb://localhost:27017/aZZure_DB";
mongoose.connect(db, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true
}, (err) => {
    if (!err) {
        console.log("connected to MongoDB server")
    } else {
        console.log("error")
    }
})


function generateNewCookie(userIdentifier) {
    // let cookie;
    // cookie = new Cookie({
    //     value: Math.floor(Math.random() * 1000000),
    //     linkedUser: userIdentifier
    // })
    // console.log(cookie.value)
    // cookie.save()
    // return cookie.value

    // generate new jwt token
    const token = jwt.sign({ userIdentifier
    }, 'RANDOM TOKEN SECRET KEY', {
        expiresIn: '24h'
    });

    // create cookie object
    const cookie = new Cookie({
        value: token,
        linkedUser: userIdentifier
    })

    console.log(cookie.value)


    // save cookie in database
    cookie.save()

    // return token
    return cookie;
}

const conSuccess = mongoose.connection
conSuccess.once('open', _ => {
  console.log('Database connected:', db)
})


app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

data = express.json()
app.use(data)

// POST user
app.post('/api/user', (req, res) => {   
    const user = new User({
        ...req.body
    })

    user.save()
        .then(() => res.status(201).json({ message: 'A new user has arrived !' }))
        .catch(error => res.status(400).json({ error }))
        
    console.log("Succesfully added user to database");
})

// GET user by ID
app.get('/api/user/:id', (req, res) => {
    User.findOne({_id: req.params.id})
        .then(user => res.status(200).json(user))
        .catch(error => res.status(404).json({ error }))
})

// GET all users
app.get('/api/user', (req, res) => {
    User.find()
        .then(users => res.status(200).json(users))
        .catch(error => res.status(400).json({ error }))
})

// UPDATE the user's data
app.put('/api/user/:id', (req, res) => {
    User.updateOne({ _id: req.params.id }, { ...req.body, _id: req.params.id })
        .then(() => res.status(200).json({ message: 'The data of the user has been modified !' }))
        .catch(error => res.status(400).json({ error }))
})

// DELETE user by ID
app.delete('/api/user/:id', (req, res) => {
    User.deleteOne({_id: req.params.id})
        .then(user => res.status(200).json({ message: 'The user has been deleted !' }))
        .catch(error => res.status(400).json({ error }))
})


// reset user database
app.delete('/api/user', (req, res) => {
    User.deleteMany({}, function(err) {
        if (err) console.log(err);
        console.log("Successful deletion");
    });
    res.status(200).json({ message: 'The user database has been deleted !' })
})



// Login user
app.post('/api/user/login', (req, res) => {
    console.log(req.body)
    User.findOne({username: req.body.username, passwd: req.body.passwd})
        .then(user => {
            if (user) {
                const cookie = generateNewCookie(user._id)
                res.status(200).json({ message: 'The user has been logged in !', cookie: cookie })
                console.log("The user has been logged in !");            
            } else {
                res.status(404).json({ message: 'The user has not been found !' })
                console.log("The user has not been found !");
            }
        })
        .catch(error => res.status(404).json({ error }))
})


async function getUserFromCookie(cookie) {
    return new Promise((resolve, reject) => {
        Cookie.findOne({ value: cookie }, (err, cookie) => {
            if (err) {
                reject(err)
            } else {
                const userId = cookie.linkedUser
                User.findOne({ _id: userId }, (err, user) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(user)
                    }
                })
            }
        })
    })
}

app.get('/api/user/cookie/:cookie', async (req, res) => {
    const cookie = req.params.cookie
    // console.log(cookie)
    const user = await getUserFromCookie(cookie)
    if (user) {
        res.status(200).json(user.username)
    } else {
        res.status(404).json({ message: 'The user has not been found !' })
    }
})


module.exports = app