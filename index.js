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

    //console.log("-->"+arrk +"-:-"+arrv);
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

      if(arrv[0].startsWith('Deploy')) {
           var transfer ="";
           try {
               if(arrv[0].endsWith('kldataSave')) {
                   if(arrv[2].startsWith('create>>')) {
                       arrv[2] = arrv[2].substring(8);
                       arrv[3] = 'KalenderBlatt.' + arrv[3];
                       await collection
                                .updateOne({ Name: arrv[2] }, { $push:{[arrv[3]] : { Patient: arrv[4], Uhrzeit: arrv[5], creationDate: parseInt(arrv[6]) }} })
                                .catch(err=>console.log('insert failed: '+err))
                   } else if(arrv[2].startsWith('delete>>')) {
                              arrv[2] = arrv[2].substring(8);
                              arrv[3] = 'KalenderBlatt.' + arrv[3];
                              await collection
                                       .updateOne({ Name: arrv[2] }, { $pull:{[arrv[3]] : { Patient: arrv[4], Uhrzeit: arrv[5], creationDate: parseInt(arrv[6]) }} })
                                       .catch(err=>console.log('delete failed: '+err))
                   }

               } else if(arrv[0].endsWith('dataSave')) {

                         await collection
                                .updateOne({ [arrk[2]]: arrv[2] }, { $push:{Beschwerden: {[arrk[3]] : arrv[3], [arrk[4]] : arrv[4], [arrk[5]] : arrv[5], [arrk[6]] : arrv[6] }} })
                                .catch(err=>console.log('insert failed: '+err))
               }

               transfer =  'Recall'+arrv[0]+' transfer succesfull -->completed';
               resend.status(200).json({body: JSON.stringify(transfer)});

           } catch (error) {
                   resend.status(400).json({ error: error });
           }
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
                                    transfer =  transfer + result.PLZ_Ort + '-->';
                          })
                } else if(arrv[0].endsWith('medE')) {

                    await collection
                          .find({isActive: 'true', Addresse: {$regex: arrv[2], $options: "i" }, Qualifikation: {$regex: arrv[3], $options: "i" } })
                          .forEach(function(result){
                                   transfer =  transfer + result.Name +'°'+  result.Tel +'°'+ result.Addresse +'°'+ result.Kassenzulassung +'°'+ result.Qualifikation + '-->';
                          })
                } else if(arrv[0].endsWith('readKalData')) {

                    transfer = '';

                    arrv[3] = 'KalenderBlatt.' + arrv[3];

                       await collection
                             .find({ Name: arrv[2] },  { projection: { _id: false,
                                                             [arrv[3]]: true
                                                           }
                                                        })
                             .forEach(function(data){
                                     for(var i in data){
                                         var key = i;
                                         var val = data[i];

                                         for(var j in val){
                                             var sub_key = j;
                                             var sub_val = val[j];
                                             for(var k in sub_val) {
                                                 var sub_key_1 = k;
                                                 var sub_val_1 = sub_val[k];
                                                 if(sub_val_1.Patient == arrv[4])
                                                    transfer = transfer +"self>>" + sub_val_1.Patient + "°" + sub_val_1.Uhrzeit + '-->';
                                                 else
                                                      transfer = transfer +"other>>" + sub_val_1.Patient + "°" + sub_val_1.Uhrzeit + '-->';
                                             }
                                         }
                                     }
                                     })
                             .catch(err=>console.log('insert failed: '+err))

                }


                resend.status(200).json({body: JSON.stringify(transfer.substring(0,transfer.length -3))});

            } catch (error) {
                    resend.status(400).json({ error: error });
            }
      }
}

