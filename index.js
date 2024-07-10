const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const port =  process.env.PORT || 3030;

var obj;
var arrk,arrv;
var resend;
var commentsCount = 0;
var complainsCount = 0;


const {MongoClient} = require('mongodb');

// We are using our packages here
app.use( bodyParser.json() );       // to support JSON-encoded bodies

app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
 extended: true})); 
app.use(cors())

//Route that handles medOrganiser logic
app.post('/medOrganiser', (req, res) =>{
	const data = req.body;
    resend = res;
    obj = data;
    arrk = Object.keys(data);
    arrv = Object.values(data);

    console.log("-->"+arrk +"-:-"+arrv);
	requestPost().catch(console.error);
})

//Start your server on a specified port
app.listen(port, ()=>{
    console.log(`Server is runing on port ${port}`)
})


async function requestPost() {
	const uri = "mongodb+srv://wh:admin01@cluster0.kmwrpfb.mongodb.net/?retryWrites=true&w=majority";
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        const collection = client.db("MedOrganiser").collection(arrv[1]);
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


async function read_write_Comments (collection) {

      if(arrv[0] == 'Deploy') {
           var transfer ="";
               await collection
                      .insertOne(obj);

           transfer =  'Rückmeldung transfer succesfull -->completed';
           resend.status(200).json({body: JSON.stringify(transfer)});
      }

      if(arrv[0].startsWith('Request')) {
                var transfer ="";
                var list;

            try {
                if(arrv[0].endsWith('pat')) {

                    await collection
                          .find({VersicherungsNummer: arrv[2]})
                          .forEach(function(result){
                                    transfer =  transfer + result.VersicherungsStatus+'°'+result.Name+'°'+result.Geburtsdatum+'°'+result.Wohnort + '-->';
                          })
                } else if(arrv[0].endsWith('plz')) {

                    await collection
                          .find({ PLZ_Ort: {$regex: arrv[2], $options: "i" } })
                          .forEach(function(result){
                                    if(result.PLZ_Ort.startsWith(arrv[2]) || result.PLZ_Ort.endsWith(arrv[2]))
                                       transfer =  transfer + result.PLZ_Ort + '-->';
                          })
                } else if(arrv[0].endsWith('medE')) {

                    await collection
                          .find({ $and: [{Addresse: {$regex: arrv[2], $options: "i" }}, {Fachbereich: {$regex: arrv[3], $options: "i" } } ] })
                          .forEach(function(result){
                                   transfer =  transfer + result.Name +'°'+  result.Tel +'°'+ result.Addresse +'°'+ result.Kassenzulassung +'°'+ result.Qualifikation + '-->';
                          })
                }

                resend.status(200).json({body: JSON.stringify(transfer.substring(0,transfer.length -3))});

            } catch (error) {
                    resend.status(400).json({ error: error });
            }
      }
}

