require('dotenv').config();
const fs = require('fs');

const data = fs.readFileSync("./test.txt");

const filename = "./testfile.txt";
const info = "July is amazing"

fs.writeFile("./testfile.txt", info, function(err)
{
    if(err)
    {
        console.log(`Found an array ${err}`)
    } 
    else
    {
         console.log(info)
        readData
    }
})

const readData = fs.readFileSync( filename, 'utf8' );


console.log(readData)