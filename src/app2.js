require( 'dotenv' ).config();
const fs = require( 'fs' );

const filename = "./testfile.txt"
const info = " April is really amazing! Will be the greatest coder very soon!!"

fs.writeFile( filename,  info, ( err )=>
{
    if ( err )
    {
        console.log( `Found an erro ${ err }` );
    } else
    {
        console.log( `Succesfully wrote to the file:)` )
    }
})

const data = fs.readFileSync( filename, 'utf8' );


console.log(data );
//https://www.google.com/search?q=asynchronous&rlz=1C1GCEA_enUS788US788&oq=async&aqs=chrome.5.69i57j69i61l3j0l2.15732j0j7&sourceid=chrome&ie=UTF-8cd..
