const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const port =  process.env.PORT || 3030;
const path = require('path');

const { MongoClient, GridFSBucket } = require('mongodb');
const fs = require('fs');

const uri = "mongodb+srv://wh:admin01@cluster0.kmwrpfb.mongodb.net/?retryWrites=true&w=majority";

var collection_0;
var collection_1;
var collection_2;

var database;
var obj;
var arrk,arrv;
var response;
var resent;




// We are using our packages here
app.use( bodyParser.json() );       // to support JSON-encoded bodies

app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
 extended: true}));
app.use(cors());

//Start your server on a specified port
app.listen(port, ()=>{
    console.log(`Server is runing on port ${port}`)
})


//Route that handles medOrganiser logic
app.post('/MedOrganiser',async (req, res) =>{

    const data = req.body;

    if(data != null) {
        response = res;

        obj = data;
        arrk = Object.keys(data);
        arrv = Object.values(data);

        console.log("-->"+JSON.stringify(obj));

	    requestPostString().catch(console.error);
	}

})




async function requestPostString() {
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        database = client.db("MedOrganiser");
        const collection = database.collection(arrv[1]);
        collection_0 = client.db("MedOrganiser").collection('Patient');
        collection_1 = client.db("MedOrganiser").collection('medEinrichtung');
        collection_2 = client.db("MedOrganiser").collection('PraxisKalender');

        try {
                await client.connect((err) => {
		                if (err) {
		                  console.log("connection established not successfully");
		                } else {
		                  console.log("connection established successfully");
                                  if(arrv[0] == 'FileDownload')
                                      downloadFile(arrv[1],arrv[2],arrv[3],database);
                                  else
                                      read_write_Comments (collection);

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

async function uploadFile(patient, path, db) {

        const fileName = patient+"_"+path.split('/').pop();

        const bucket = new GridFSBucket(db, {
                                   bucketName: 'Diagnostik'
                           });

            // Read the file stream and upload
            await fs.createReadStream(path).pipe(bucket.openUploadStream(fileName))
                .on('error', function(error) {
                    console.log('Error:', error);
                })
                .on('finish', function() {
                    console.log('File uploaded successfully.');
                    return true;
                });
}


async function downloadFile(coll,patient,file, database) {

        const collection_3 = database.collection(coll)
        const fileName = patient+"_"+file;

        const documentPdf = await collection_3.findOne({
              filename: fileName
            });

            const documentId = documentPdf._id;

            const bucket = new GridFSBucket(database, {
                                                   bucketName: 'Diagnostik'
                                                });

            const downloadStream = bucket.openDownloadStream(documentId);
            //const writeStream = fs.createWriteStream(file);
            response.writeHead(200, {
                'Content-Type': 'application/pdf',
                'Response-Type': 'arraybuffer',
                'Content-Disposition': 'attachment',
                'Filename' : file
                });

        await downloadStream.pipe( response )
                        .on('error', function(error) {
                                    console.log('Error:', error);
                                })
                        .on('finish', () => {
                            console.log('File download successfully.'); 
                        });

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

                                .then(data=> {
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
                                            .then(data=> {
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
                              if (AktivStatus.startsWith('MedizinischesPersonal')) {

                                   next = false;

                                   await collection_1
                                            .findOne({$and: [{[arrk[6]]: {$regex: arrv[6].substring(0,arrv[6].indexOf(' '))}}, {[arrk[6]]: {$regex: arrv[6].substring(arrv[6].indexOf(' ')+1)}}]})
                                            .then(data=> {
                                                          if(data != null) {
                                                             isPersonal = 'Arzt'
                                                             obj.AktivStatus = obj.AktivStatus +' Typ I'
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

                          await collection_1
                                   .updateOne({$and: [{[arrk[6]]: {$regex: arrv[6].substring(0,arrv[6].indexOf(' '))}}, {[arrk[6]]: {$regex: arrv[6].substring(arrv[6].indexOf(' ')+1)}}]}
                                                                               , {$set: {VersicherungsNummer: VersNr, LebenslangeArztNr: arrv[9]}});

                          await collection_2
                                   .updateOne({$and: [{[arrk[6]]: {$regex: arrv[6].substring(0,arrv[6].indexOf(' '))}}, {[arrk[6]]: {$regex: arrv[6].substring(arrv[6].indexOf(' ')+1)}}]}
                                                                                                                          , {$set: {VersicherungsNummer: VersNr}});
                       }

                       if (next) {
                               next = false;
                               await collection
                                        .insertOne(obj)
                                        .then(data=> {
                                                       transfer = 'Erfolgreicher Eintrag der PatientenDaten: VersNr >>' +VersNr +'-->'+obj.AktivStatus})
                                        .catch(err=>console.log('insert failed: '+err));
                       }

               } else if(arrv[0].endsWith('dataChanged')) {
                       var AktivStatus = '';

                       if("AktivStatus" in obj) {
                            AktivStatus = obj.AktivStatus;

                                 if(AktivStatus != 'Patient') {
                                      if (AktivStatus.startsWith('MedizinischesPersonal')) {

                                           next = false;

                                           await collection_1
                                                    .findOne({$and: [{[arrk[3]]: {$regex: arrv[3].substring(0,arrv[3].indexOf(' '))}}, {[arrk[3]]: {$regex: arrv[3].substring(arrv[3].indexOf(' ')+1)}}]})
                                                    .then(data=> {
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

                       delete obj.Caller;
                       delete obj.Collection;
                       delete obj.VersicherungsNummer;
                       delete obj.Name;


                       await collection
                               .updateOne( {[arrk[2]]: arrv[2]}, {$set: obj})
                               .catch(err=>console.log('datChanged failed: '+err));

                       transfer = 'dataChanged successfull';

               } else if(arrv[0].includes('-pers')) {
                       delete obj.Caller;
                       delete obj.Collection;

                       var success = false;
                       var s1 = obj[arrk[2]];

                       for(var i=0;i<s1.length;i++) {
                           var s2 = s1[i];

                              if(!success) {
                                 if(arrv[0].endsWith('Eintrag')) {
                                    await collection
                                       .updateOne( {}, {$push: {[arrk[2]]: s2}}, {upsert:true})
                                       .then(data=> {
                                                      if(JSON.stringify(data.modifiedCount) == '0') {
                                                         success = true;
                                                         collection
                                                                 .insertOne(obj)
                                                                 .then(data=> {console.log('Erfolgreicher Erst-Eintrag der PedrsonalDaten'); })
                                                      } else  {
                                                                success = true;
                                                                console.log('Erfolgreiche Addition der PedrsonalDaten');
                                                      }
                                                    })
                                       .catch(err=>console.log('insert failed: '+err));
                                 } else if(arrv[0].endsWith('Delete')) {
                                    delete s2.Datum;

                                    await collection
                                       .updateOne( {}, {$pull: {[arrk[2]]: s2}}, {upsert:true})
                                       .then(data=> {
                                              if(JSON.stringify(data.modifiedCount) == '1') {
                                                  success = true;
                                                  console.log('Erfolgreicher Delete der PersonalDaten');
                                              }
                                       })
                                        .catch(err=>console.log('delete failed: '+err));
                                 }
                              }

                           if(success) {

                                 if(arrv[0].endsWith('Eintrag')) {
                                    await collection_0
                                           .updateOne({ $and: [ {Name: s2.Name }, { Geburtsdatum: s2.Geburtsdatum } ] },{ $set: {AktivStatus: arrk[2] + ' Typ ' +s2.Typ}})
                                           .then(data=> {
                                                          console.log('Erfolgreicher Eintrag in die PatientenDaten ')})
                                           .catch(err=>console.log('insert failed: '+err));
                                 } else   if(arrv[0].endsWith('Delete')) {

                                    await collection_0
                                           .updateOne({ $and: [ {Name: s2.Name }, { Geburtsdatum: s2.Geburtsdatum } ] },{ $set: {AktivStatus: 'Patient'}})
                                           .then(data=> {
                                                          console.log('Erfolgreicher Delete in den PatientenDaten ')})
                                           .catch(err=>console.log('delete failed: '+err));
                                 }

                              success = false;
                           }
                           if(i == s1.length -1)
                              transfer = 'Erfolgreiche Bearbeitung der Patienten- PersonalDaten -->';
                       }

               } else if(arrv[0].endsWith('kldataSave')) {



                   if(arrv[2].startsWith('create>>')) {
                       arrv[2] = arrv[2].substring(8);
                       await collection
                                .updateOne({ VersicherungsNummer: arrv[5] }, { $push:{Konsultationen: {[arrk[4]] : arrv[4], [arrk[7]] : arrv[7], [arrk[6]] : arrv[6], [arrk[8]] : arrv[8], [arrk[9]] : arrv[9] }} })
                                .catch(err=>console.log('delete failed: '+err))

                       await collection_2
                                .updateOne({ [arrk[2]]: arrv[2] }, { $push:{[arrk[3]] : { [arrk[4]]: arrv[4], [arrk[5]]: arrv[5], [arrk[6]]: arrv[6], [arrk[7]]: parseInt(arrv[7]) }} })
                                .catch(err=>console.log('insert failed: '+err))

                   } else if(arrv[2].startsWith('delete>>')) {
                              arrv[2] = arrv[2].substring(8);
                              await collection
                                     .updateOne({ VersicherungsNummer: arrv[5] }, { $pull:{Konsultationen: {[arrk[4]] : arrv[4], [arrk[7]] : arrv[7], [arrk[6]] : arrv[6], [arrk[8]] : arrv[8], [arrk[9]] : arrv[9] }} })
                                     .catch(err=>console.log('delete failed: '+err))

                              await collection_2
                                       .updateOne({ [arrk[2]]: arrv[2] }, { $pull:{[arrk[3]] : { [arrk[4]]: arrv[4], [arrk[5]]: arrv[5], [arrk[6]]: arrv[6], [arrk[7]]: parseInt(arrv[7]) }} })
                                       .catch(err=>console.log('delete failed: '+err))
                   }
                   transfer = 'successfull';

               }

               transfer =  'Recall'+arrv[0]+' '+transfer+' -->completed';
               response.status(200).json({body: JSON.stringify(transfer)});

           } catch (error) {
                   response.status(400).json({ error: error });
           }
      }

      if(arrv[0].startsWith('Request')) {
                var transfer ="";
                var list;

            try {
                if(arrv[0].endsWith('patDaten')) {
                    var n = 0; 
                    await collection
                          .find({[arrk[2]]: arrv[2]})
                          .forEach(function(obj) {
                                    if(obj != null) {

                                        Object.keys(obj).forEach((k, i) => {

                                            if (n > 2  && n < 15) {
                                                 transfer = transfer +k+"---"+obj[k]+'°';
                                            }
                                            else if(n >= 15)  {

                                                     transfer = transfer.substring(0,transfer.length -1) +'-->'+k+'---';
                                                     Object.keys(obj[k]).forEach((j, l) => {
                                                           transfer = transfer+ JSON.stringify(obj[k][j]) +'^';
                                                      });
                                                transfer = transfer +'°';
                                            }  
                                            n++;
                                        });

                                        //transfer =  transfer+ '-->';
                                    }
                          })

                          .catch(err=>console.log('patData failed: '+err));


                } else if(arrv[0].endsWith('personalDaten')) {
                    transfer = "";

                    await collection
                          .find({ [arrk[2]]: arrv[2] })
                          .forEach(function(data){
                                   for(var i in data){
                                       var key = i;
                                       var val = data[i];
                                       if(key == 'Name' || key == 'LebenslangeArztNr')
                                          transfer = transfer + val +'-->';
                                   }

                          })
                          .catch(err=>console.log('personalData failed: '+err));

                } else if(arrv[0].endsWith('patDiagnostik')) {

                    await collection
                          .find( {[arrk[2]]: arrv[2]})
                          .forEach(function(data){
                                 for(var i in data){
                                     var key = i;
                                     var val = data[i];

                                     if(key == 'Diagnostik') {
                                         var map = val.map(item => item.Art+'>>'+item.Datum+'°'+item.Behandler+'°'+item.file);
                                     }
                                 }

                                 var arr = Array.from(map.entries());

                                 for(var i=0; i<arr.length; i++) {

                                     var json = JSON.stringify(arr[i]).replaceAll('"','').replace('[','').replace(']','');
                                         json = json.substring(json.indexOf(',') +1);

                                     if(json.startsWith(arrv[3]) && parseInt(json.substring(json.indexOf('>>')+2,json.indexOf('°'))) >= parseInt(arrv[4])) {
                                          transfer = transfer + json.substring(json.indexOf('>>')+2) + '-->';

                                     }

                                 }
                          })
                          .catch(err=>console.log('READDIAGNOSTIK failed: '+err))


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

                    transfer = "";

                       await collection
                             .find({[arrk[2]]: arrv[2]})
                             .forEach(function(data){

                                    for(var i in data){
                                         var key = i;
                                         var val = data[i];
                                         if(key == 'Name')
                                            transfer = transfer + val + '-->';
                                         if(key == 'KalenderBlatt') {
                                           var map = val.map(item => item.Patient+'°'+item.TerminiertesDatum+'°'+item.TerminierteUhrzeit+'-->');

                                         }
                                    }

                                 transfer = transfer + map;
                             })
                             .catch(err=>console.log('insert failed: '+err))

                } else if(arrv[0].endsWith('diagnosen')) {

                             await collection
                                     .find({$or: [{ICD10: {$regex:arrv[2]}}, {Diagnose: {$regex:arrv[2]}}]},{ _id: 0 })
                                     .forEach(function(result){

                                              transfer =  transfer + result.ICD10 +'°'+  result.Diagnose + '-->';
                                     })
                } else if(arrv[0].endsWith('persSearch')) {
                         var transfer = '';
                         var st = '';
                         var str = arrv[2] + '.' +arrk[3];

                             await collection
                                     .find({ [str]: arrv[3] })
                                     .forEach(function(data){
                                            for(var i in data){
                                                var key = i;
                                                var val = data[i];

                                                if(key == arrv[2]) {
                                                   st = JSON.stringify(val.map(function(item) {return [item.Autorisiert, item.Name, item.Geburtsdatum, item.Typ].join('°');})).replace('[','').replace(']','').replaceAll('"','');
                                                }
                                            }

                                     })
                                     .then(res => {
                                            var ges = st.split(',');

                                            for(var i=0;i<ges.length;i++)
                                                if(ges[i].includes(arrv[3])) {
                                                   transfer = transfer + ges[i] + '-->';
                                                }

                                     })


                }


                response.status(200).json({body: JSON.stringify(transfer.substring(0,transfer.length -3))});

            } catch (error) {
                    response.status(400).json({ error: error });
            }
      }
}

