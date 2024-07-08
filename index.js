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
app.post('/medOrganiser', (req, res) =>{
	const data = req.body;
    resend = res;
        
	arr = data.toString().split(',');

    console.log("-->-"+arr);
	requestPost().catch(console.error);
})

//Start your server on a specified port
app.listen(port, ()=>{
    console.log(`Server is runing on port ${port}`)
})


async function requestPost() {
	const uri = "mongodb+srv://wh:admin01@cluster0.kmwrpfb.mongodb.net/?retryWrites=true&w=majority";
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        const collection = client.db("MedOrganiser").collection(arr[1]);
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

function createDocument(filds, i) {
  var value = arr[i].split('°');
  for(var n=0;n<filds.length;n++)
      console.log(filds[n]+" : "+value[n]);
  var obj = {};
      filds.forEach((item, index) => {

         obj[item] = value[index];

      });

  return obj;
}

async function read_write_Comments (collection) {
      if(arr[0] == 'Deploy') {
         var transfer ="";
         var filds = arr[2].split('°');
           for(var i=3;i<arr.length;i++) {
                 await collection
                            .insertOne(createDocument(filds, i));
           }
           transfer =  'Rückmeldung transfer succesfull -->completed';
           resend.status(200).json({body: JSON.stringify(transfer)});

      }  if(arr[0].startsWith('Request')) {
                var transfer ="";
                var list;

            try {
                if(arr[0].endsWith('pat')) {
                    await collection
                          .find({VersicherungsNummer: arr[2]})
                          .forEach(function(result){
                                    transfer =  transfer + result.VersicherungsStatus+'°'+result.Name+'°'+result.Geburtsdatum+'°'+result.Wohnort + '-->';
                          })
                } else if(arr[0].endsWith('plz')) {
                   await collection
                         .find({ PLZ_Ort: {$regex: arr[2], $options: "i" } })
                         .forEach(function(result){
                                   if(result.PLZ_Ort.startsWith(arr[2]) || result.PLZ_Ort.endsWith(arr[2]))
                                      transfer =  transfer + result.PLZ_Ort + '-->';
                         })
                } else if(arr[0].endsWith('medE')) {
                   console.log(arr[2]+ "-----" + arr[3])
                   await collection
                         .find({ $and: [{Addresse: {$regex: arr[2], $options: "i" }}, {Fachbereich: {$regex: arr[3], $options: "i" } } ] })
                         .forEach(function(result){
                                  transfer =  transfer + result.Name +'°'+  result.Telephon +'°'+ result.Addresse +'°'+ result.Kassenzulassung +'°'+ result.Fachbereich + '-->';
                         })
                }

                resend.status(200).json({body: JSON.stringify(transfer.substring(0,transfer.length -3))});

            } catch (error) {
                    resend.status(400).json({ error: error });
            }
      }
}

