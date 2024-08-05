const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const port =  process.env.PORT || 3030;
var collection_1;
var collection_2;

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

    //console.log("-->"+JSON.stringify(obj));
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
        collection_1 = client.db("MedOrganiser").collection('medEinrichtung');
        collection_2 = client.db("MedOrganiser").collection('PraxisKalender');
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

function getRandomInt(min, max) {
          min = Math.ceil(min);
          max = Math.floor(max);
          var erg = ''+Math.floor(Math.random() * (max - min + 1));
          var z = '000000000'

          if(erg.length < (""+max).length)
             erg = erg + z.substring(0,(""+max).length - erg.length);
          return erg;
}

async function read_write_Comments (collection) {

      if(arrv[0].startsWith('Deploy')) {
           var transfer ="";
           try {

               if(arrv[0].endsWith('saveAufn')) {
                      delete obj.Caller;
                      delete obj.Collection;
                      var isPersonal = '';

                      var VersNr = "";
                      var next = false;
                       await collection
                                .findOne({$and: [{[arrk[6]]: {$regex: arrv[6].substring(0,arrv[6].indexOf(' '))}}, {[arrk[6]]: {$regex: arrv[6].substring(arrv[6].indexOf(' ')+1)}},
                                                  {[arrk[7]]: arrv[7]}]})

                                .then(data=> { console.dir("first--"+data);
                                	          if(data != null)
                                	               transfer = 'Ein Patient mit den eingegebenen Daten >>'+arrv[6]+' >> '+arrv[7]+' ist bereits existent';
                                	          else next = true;
                                	          });
                       if (next) {
                           var stop = false;
                           next = false;
                           var VersNr = "";
                           while (!stop) {
                                VersNr = arrv[6].substring(0,1) + getRandomInt(0, 999999999);

                                await collection
                                            .findOne({VersicherungsNummer: VersNr})
                                            .then(data=> { console.dir("second--"+data);
                                                          if(data == null) {
                                                              obj.VersicherungsNummer = VersNr;
                                                              next = true;
                                                              stop = true;
                                                          }
                                                     });
                           }
                       }
                       if (next) {
                           var AktivStatus = arrv[12];

                           if(AktivStatus != 'Patient') {
                              if (AktivStatus == 'Medizinisches Personal') {

                                   next = false;

                                   await collection_1
                                            .findOne({$and: [{[arrk[6]]: {$regex: arrv[6].substring(0,arrv[6].indexOf(' '))}}, {[arrk[6]]: {$regex: arrv[6].substring(arrv[6].indexOf(' ')+1)}}]})
                                            .then(data=> {console.dir("third--"+data);
                                                          if(data != null) {
                                                             isPersonal = 'Arzt'
                                                             next = true;
                                                          } else {
                                                              obj.AktivStatus = 'Patient';
                                                              next = true;
                                                          }
                                                     });
                              } else
                                 obj.AktivStatus = 'Patient';
                           }
                       }

                       if(next && isPersonal == 'Arzt') {
                          console.dir("fourth--"+isPersonal+"----VersNr");
                          await collection_1
                                   .updateOne({$and: [{[arrk[6]]: {$regex: arrv[6].substring(0,arrv[6].indexOf(' '))}}, {[arrk[6]]: {$regex: arrv[6].substring(arrv[6].indexOf(' ')+1)}}]}
                                                                               , {$set: {VersicherungsNummer: VersNr}});

                          await collection_2
                                   .updateOne({$and: [{[arrk[6]]: {$regex: arrv[6].substring(0,arrv[6].indexOf(' '))}}, {[arrk[6]]: {$regex: arrv[6].substring(arrv[6].indexOf(' ')+1)}}]}
                                                                                                                          , {$set: {VersicherungsNummer: VersNr}});
                       }

                       if (next) {
                               next = false;
                               await collection
                                        .insertOne(obj)
                                        .then(data=> { console.dir("fifth--"+data);
                                                       transfer = 'Erfolgreicher Eintrag der PatientenDaten: VersNr >>' +VersNr;})
                                        .catch(err=>console.log('insert failed: '+err));
                       }

               } else if(arrv[0].endsWith('kldataSave')) {

                   if(arrv[2].startsWith('create>>')) {
                       arrv[2] = arrv[2].substring(8);

                       await collection
                                .updateOne({ Name: arrv[2] }, { $push:{[arrk[3]] : { [arrk[4]]: arrv[4], [arrk[5]]: arrv[5], [arrk[6]]: arrv[6], [arrk[7]]: parseInt(arrv[7]) }} })
                                .catch(err=>console.log('insert failed: '+err))

                   } else if(arrv[2].startsWith('delete>>')) {
                              arrv[2] = arrv[2].substring(8);

                              await collection
                                       .updateOne({ Name: arrv[2] }, { $pull:{[arrk[3]] : { [arrk[4]]: arrv[4], [arrk[5]]: arrv[5], [arrk[6]]: arrv[6], [arrk[7]]: parseInt(arrv[7]) }} })
                                       .catch(err=>console.log('delete failed: '+err))
                   }
                   transfer = 'successfull';

               } else if(arrv[0].endsWith('dataSave')) {

                         await collection
                                .updateOne({ [arrk[2]]: arrv[2] }, { $pull:{Konsultationen: {[arrk[3]] : arrv[3], [arrk[4]] : arrv[4], [arrk[5]] : arrv[5], [arrk[6]] : arrv[6] }} })
                                .catch(err=>console.log('delete failed: '+err))

                         await collection
                                .updateOne({ [arrk[2]]: arrv[2] }, { $push:{Konsultationen: {[arrk[3]] : arrv[3], [arrk[4]] : arrv[4], [arrk[5]] : arrv[5], [arrk[6]] : arrv[6] }} })
                                .catch(err=>console.log('insert failed: '+err))
                         transfer = 'successfull';
               }

               transfer =  'Recall'+arrv[0]+' '+transfer+' -->completed';
               resend.status(200).json({body: JSON.stringify(transfer)});

           } catch (error) {
                   resend.status(400).json({ error: error });
           }
      }

      if(arrv[0].startsWith('Request')) {
                var transfer ="";
                var list;

            try {
                if(arrv[0].endsWith('patDaten')) {
                    await collection
                          .find({VersicherungsNummer: arrv[2]})
                          .forEach(function(obj){
                                    if(obj != null) {

                                        Object.keys(obj).forEach((k, i) => {
                                            if (!k.includes('Datum') && !k.includes('_id') && !k.includes('Medikamente')) {
                                                transfer = transfer +k+"---"+obj[k]+'°';
                                            } else if(k.includes('Medikamente')) {
                                                     transfer = transfer +k+'^';
                                                     Object.keys(obj[k]).forEach((j, l) => {
                                                           transfer = transfer+ JSON.stringify(obj[k][j]) +'^';
                                                     });
                                                     transfer = transfer+'°';
                                            }
                                        });

                                        transfer =  transfer+ '-->';
                                    }
                          })

                } else if(arrv[0].endsWith('pat')) {

                    await collection
                          .find({VersicherungsNummer: arrv[2]})
                          .forEach(function(result){
                                    transfer =  transfer + result.VersicherungsStatus+'°'+result.Name+'°'+result.Geburtsdatum+'°'+result.PLZWohnort+ '-->';
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

                } else if(arrv[0].endsWith('diagnosen')) {

                             await collection
                                     .find({$or: [{ICD10: {$regex:arrv[2]}}, {Diagnose: {$regex:arrv[2]}}]},{ _id: 0 })
                                     .forEach(function(result){

                                              transfer =  transfer + result.ICD10 +'°'+  result.Diagnose + '-->';
                                     })
                }


                resend.status(200).json({body: JSON.stringify(transfer.substring(0,transfer.length -3))});

            } catch (error) {
                    resend.status(400).json({ error: error });
            }
      }
}

