const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const port =  process.env.PORT || 3030;

var arr;
var resend;
var commentsCount = 0;
var complainsCount = 0;


const {MongoClient} = require('mongodb');

// We are using our packages here
app.use( bodyParser.json() );       // to support JSON-encoded bodies

app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
 extended: true})); 
app.use(cors())

//Route that handles Anklage logic
app.post('/Anklage', (req, res) =>{
	const data = req.body;
    resend = res;
	arr = data.toString().split(",");

    //console.log("-->-"+arr);
	requestPost().catch(console.error);
})

//Start your server on a specified port
app.listen(port, ()=>{
    console.log(`Server is runing on port ${port}`)
})


async function requestPost() {
	const uri = "mongodb+srv://wh:admin01@cluster0.kmwrpfb.mongodb.net/?retryWrites=true&w=majority";
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        const collection = client.db("Anklage").collection("BundesVerfassungsGericht");;
        try {
                await client.connect((err) => {
		  if (err) {
		    console.log('Connection to server wasnt successfull');
		  } else {
		    console.log('Connected successfully to server');

                    read_write_Comments (collection)
		  }
		})
                    
        } catch (e) {
		   console.error(e);
        } finally {
                   try {
                        await client.close();
                   } catch (e) {}
        }
        
                   
}

function createDocument() {

        var crDate =  arr[1].substring(arr[1].length -2) +"."+ arr[1].substring(arr[1].length -4,
                                              arr[1].length -2) +"."+ arr[1].substring(0, arr[1].length -4);


        if(arr[0] === "Deploy_Mitklaeger") {
            complainsCount = Number(complainsCount) +1;
            var docu = {
                        //_id: id,
                        createdDate: crDate,
                        Titel: arr[2],
                        Name: arr[3],
                        Vorname: arr[4],
                        Geb: arr[5],
                        PLZ_Ort: arr[6],
                        Str_HausNr: arr[7],
                        Email: arr[8],
                        Tel: arr[9]
            }
        } else if(arr[0] === "Deploy_Seite") {
            var str = "", comma = ",";
            commentsCount = Number(commentsCount) +1;

            for(var x=3;x<arr.length;x++) {
                if(x == arr.length -1) comma = "";

                str = str+arr[x]+comma;

            }
            var docu = {
                        //_id: id,
                        createdDate: crDate,
                        Seite: Number(arr[2]),
                        SeitenInhalt: str
            }
        }

    return docu;
}

async function read_write_Comments (collection) {

        await collection
            .countDocuments({Seite: {$exists: true}})
            .then(
        	 (myCount) =>{
        	          commentsCount = myCount;
      	         }
        	);

        await collection
           .countDocuments({Name: {$exists: true}})
           .then(
            (myCount) =>{
                  complainsCount = myCount;
 	             }
            );


	dbEntrace(collection);
}
async function dbEntrace (collection) {

    if(arr[0].startsWith('Deploy')) {
        var transfer ="";
        if(arr[0].endsWith('Seite')) {
            await collection
                            .deleteOne({ Seite: Number(arr[2]) });

        } else if(arr[0].endsWith('Mitklaeger')) {
               await collection
                               .deleteOne( { Name: arr[3] }, { Vorname: arr[4] } );

        }

        await collection
                         .insertOne(createDocument());

        transfer =  commentsCount+'-->'+complainsCount;
        resend.status(200).json({body: JSON.stringify(transfer)});
    }
    else if(arr[0].startsWith('Request')) {
       var transfer ="";
       var list;


       try {
          await collection
                .find({Seite: Number(arr[1])}, {SeitenInhalt:1, _id:0} )
                .forEach(function(records){

                          transfer =  commentsCount+'-->'+complainsCount+
                          "-->"+ records.SeitenInhalt;
                 })

           resend.status(200).json({body: JSON.stringify(transfer)});
         } catch (error) {
           resend.status(400).json({ error: error });
         }
    }

}

