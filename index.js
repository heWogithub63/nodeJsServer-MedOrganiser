
const express = require('express')
const app = express()
const { Readable } = require('stream');
const bodyParser = require('body-parser')
const cors = require('cors')
const port =  process.env.PORT || 3030;

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
var request;
var resent;
var reqUrl;
var trans;




// We are using our packages here
app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: '35mb',
    parameterLimit: 50000,
  }),
);

// to support JSON-encoded bodies
app.use(bodyParser.json({limit: '35mb'}));

app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
 extended: true}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Start your server on a specified port
app.listen(port, ()=>{
    console.log(`Server is runing on port ${port}`)
})

// Add a basic route to check if server's up
app.get('/medOrganiser', (req, res) => {
  res.status(200).send(`Server up and running`);
});

//Route that handles medOrganiser logic
app.post('/medOrganiser',async (req, res) =>{

    const data = req.body;

    if(data != null) {
        response = res;
        request = req;
        obj = data;
        arrk = Object.keys(data);
        arrv = Object.values(data);

        //console.log("-->"+JSON.stringify(obj));

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
        collection_3 = client.db("MedOrganiser").collection('Personal');
        try {
                await client.connect((err) => {
		                if (err) {
		                  console.log("connection established not successfully");
		                } else {
		                  console.log("connection established successfully");
                                  if(arrv[0] == 'FileDownload')
                                      downloadFile(arrv[1],arrv[2],arrv[3],database);
                                  else if(arrv[0] == 'FileUpload')
                                      uploadFile(arrv[1],arrv[2],arrv[3],database);
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

async function uploadFile(coll, patient, path, db) {

       const buffer = Buffer.from(arrv[8])
       const readable = new Readable()
       readable._read = () => {} // _read is required but you can noop it
       readable.push(buffer)
       readable.push(null)

        const fileName = patient+"_"+path.split('/').pop();
        const bName = arrv[1];

        const bucket = new GridFSBucket(db, {
                                   bucketName:  bName
                           });

            // Read the file stream and upload
            await readable.pipe(bucket.openUploadStream(fileName))
                .on('error', function(error) {
                    console.log('Error:', error);
                })
                .on('finish', function() {
                    arrv[0] = 'Deploy_uploadFile';
                    obj = {
                           [arrv[1]] : {[arrk[4]] : arrv[4],
                                        [arrk[5]] : parseInt(arrv[5]),
                                        [arrk[6]] : arrv[6],
                                        [arrk[7]] : arrv[7]
                                       }
                    }
                    read_write_Comments (collection_0);
                });
}


async function downloadFile(coll,patient,file, database) {

        const collection_3 = database.collection(coll)
        const fileName = patient+"_"+file;

        const documentPdf = await collection_3.findOne({
              filename: fileName
            });

            const documentId = documentPdf._id;
            const bName = arrv[1].substring(0,arrv[1].lastIndexOf('.'));

            const bucket = new GridFSBucket(database, {
                                                   bucketName: bName
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

async function getPasswort(kindOfPersonal, VerNr) {

          if(kindOfPersonal.startsWith('Medizinisches') && kindOfPersonal.endsWith('Typ I')) {

              var ret = 'nothing found';
              var pointer = await collection_1
                                     .find({VersicherungsNummer: VerNr}).toArray();
                  pointer.forEach( data => {

                           if(data != null) {
                              for (k in data) {

                                 if(k === 'Passwort') {
                                    ret = data[k];
                                    break;
                                 }
                              }

                           }

                  });
              return ret;
          } else {

              var ret = 'nothing found';
              var key = kindOfPersonal.substring(0, kindOfPersonal.indexOf(' '))+'.PatVersicherungsNummer';
              var kindOf = kindOfPersonal.substring(0,kindOfPersonal.indexOf(' '));

              var pointer = await collection_3
                                     .find({[key]: VerNr}).toArray();
                  pointer.forEach( data => {
                           if(data != null) {
                               for (k in data) {
                                    var val = data[k];
                                    if(k === kindOf)
                                       for(j in val) {
                                           var val1 = val[j];
                                           for (i in val1)
                                               if(i === 'Passwort') {
                                                  ret = val1[i];
                                               }
                                       }

                               }
                           }
                  });
              return ret;
          }

}

async function setPasswort(kindOfPersonal, VerNr, password) {

          if(kindOfPersonal.startsWith('Medizinisches') && kindOfPersonal.endsWith('Typ I')) {
              await collection_1
                          .updateOne({VersicherungsNummer: VerNr}, {$set: {Passwort: password}});

          } else {
              var key = kindOfPersonal.substring(0, kindOfPersonal.indexOf(' '))+'.PatVersicherungsNummer';
              var key1 = kindOfPersonal.substring(0, kindOfPersonal.indexOf(' '))+'.$.Passwort';

              await collection_3
                           .updateOne({[key]: VerNr}, {$set: {[key1]: password}});

          }

}

function isEmpty(obj) {
  for (const prop in obj) {
    if (Object.hasOwn(obj, prop)) {
      return false;
    }
  }

  return true;
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
                       var pswd = '';
                       if(obj.Passwort != null) {
                          pswd = obj.Passwort;
                          delete obj.Passwort;
                       }
                       delete obj.Caller;
                       delete obj.Collection;
                       delete obj.VersicherungsNummer;
                       delete obj.Name;


                       await collection
                               .updateOne( {[arrk[2]]: arrv[2]}, {$set: obj})
                               .then(data=> {
                                 
                                   if(arrv[0].includes('-dAe-') && pswd != '' && obj.AktivStatus !== 'Patient')
                                      setPasswort(obj.AktivStatus, arrv[2], pswd);
                                                          
                               })
                               .catch(err=>console.log('datChanged failed: '+err));


                       transfer = 'dataChanged successfull';

               }  else if(arrv[0].endsWith('uploadFile')) {
                       await collection
                               .updateOne( {[arrk[2]]: arrv[2]}, {$push: obj})
                               .catch(err=>console.log('duploadFile failed: '+err));

                       transfer = 'uploadFile successfull';

               }  else if(arrv[0].includes('-pers')) {
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

               } else if(arrv[0].endsWith('sendAbr')) {

                   var next = false;
                   var collexist = false;
                   delete obj.Caller;
                   delete obj.Collection;

                       var cursor = await collection
                                             .find({$and: [{[arrk[2]]: arrv[2]}, {[arrk[3]]: arrv[3]}]}).toArray();

                           if(!isEmpty(cursor)) {

                                     var ar1 = JSON.stringify(arrv[5]);
                                         ar1 = ar1.substring(1,ar1.length -1);

                                     arrv[5] = JSON.parse(ar1);

                               await collection
                                          .updateOne({[arrk[2]]: arrv[2]}, { $push: {[arrk[5]]: arrv[5]}});

                           } else {
                               await collection
                                         .insertOne(obj);
                           }

                       await collection_1
                             .updateOne({$or: [{[arrk[3]]: arrv[3]}, {Name: {$regex: arrv[2].substring(arrv[2].lastIndexOf(' '))}}]}, {$set: {[arrk[4]]: arrv[4]}})
                             .then(data=> {

                                            transfer = 'Erfolgreicher Eintrag der AbrechnungsDaten:';
                             })


               }

               transfer =  'Recall'+arrv[0]+' '+transfer+' -->completed';
               response.status(200).json({body: JSON.stringify(transfer)});

           } catch (error) {
                   response.status(400).json({ error: error });
           }
      }

      if(arrv[0].startsWith('Request')) {

            var list;

            try {
                if(arrv[0].endsWith('patDaten')) {

                    transfer = "";
                    var n = 0;
                    var n1 = 0;
                    var cursor = await collection
                                           .find({[arrk[2]]: arrv[2]}).toArray();

                        if(!isEmpty(cursor)) {

                            cursor.forEach(result => {
                                for(var k in result) n1++;
                                for(k in result) {

                                    if (n > 2  && n < 15) {

                                         transfer = transfer +k+"---"+result[k]+'°';

                                         if(arrv[0].includes('-dAe-') && k === 'AktivStatus' && result[k] !== 'Patient') {

                                            getPasswort(result[k], arrv[2]).then(function(back) {

                                                  transfer = transfer + 'Passwort---' + back;
                                                  dataReturn(transfer);
                                                });

                                         }

                                    }
                                    else if(n >= 15)  {

                                             transfer = transfer.substring(0,transfer.length -1) +'-->'+k+'---';
                                             Object.keys(result[k]).forEach((j, l) => {
                                                   transfer = transfer+ JSON.stringify(result[k][j]) +'^';
                                              });
                                        transfer = transfer +'°';
                                    }

                                    if(!arrv[0].includes('-dAe-') && n === n1 -1)
                                        dataReturn(transfer.substring(0,transfer.lastIndexOf('°')));

                                  n++;
                                }

                            });

                        }  else
                             dataReturn(transfer);

                } else if(arrv[0].endsWith('personalDaten')) {

                    transfer = "";
                    var n = 0;
                    var n1 = 0;

                    var cursor = await collection
                                          .find( {[arrk[2]]: arrv[2]} ).toArray();

                        if(!isEmpty(cursor))  {

                            cursor.forEach (data => {
                                 for(var i in data) n1++;
                                 for(var i in data) {
                                     var key = i;
                                     var val = data[i];

                                     if(key != '_id' && key != 'isActive') {
                                           transfer = transfer + key +'---'+ val +'°';

                                     }
                                    n++;
                                 }

                                 if(n === n1)
                                    dataReturn(transfer.substring(0,transfer.lastIndexOf('°')));
                            });

                        } else {

                            var fS = arrv[3].substring(0,arrv[3].indexOf(' '));

                            var key = fS+'.PatVersicherungsNummer';
                            var key1 = fS+'.$';
                            var map;

                            var cursor = await collection_3
                                                .find({ [key]:  arrv[2] }).toArray();

                                if(!isEmpty(cursor)) {

                                    cursor.forEach( result => {

                                        for(var i in result) {
                                            var key = i;
                                            var val = result[i];

                                            if(key == fS) {
                                               map = val.map(item => 'PatName---'+item.PatName+'°'+'PatVersicherungsNummer---'+item.PatVersicherungsNummer+'°'+'Autorisiert_von_Name---'+
                                                                      item.Autorisiert_von_Name+'°'+'Autorisiert_von_VersicherungsNummer---'+item.Autorisiert_von_VersicherungsNummer);
                                            }
                                        }

                                        if(n === cursor.length -1) {

                                           var arrStr = JSON.stringify(map);
                                               arrStr = arrStr.replace('["','').replace('"]','');

                                               if(arrStr.includes(arrv[2]))
                                                  transfer = transfer + arrStr +'-->';

                                           dataReturn(transfer);
                                        }

                                       n++;

                                    });

                                } else
                                    dataReturn(transfer);

                        }

                } else if(arrv[0].endsWith('patDiagnostik')) {

                    transfer = "";
                    var n = 0;


                    var cursor = await collection
                                           .find( {[arrk[2]]: arrv[2]}).toArray();
                        cursor.forEach(function(data){

                                 if(data != null) {

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

                                      if(n === cursor.length -1)
                                         dataReturn(transfer.substring(0,transfer.lastIndexOf('-->')));

                                    n++;
                                 } else
                                       dataReturn(transfer);

                        });


                } else if(arrv[0].endsWith('pat')) {

                    transfer = "";
                    var n = 0;

                    var cursor = await collection
                                         .find({VersicherungsNummer: arrv[2]}).toArray();
                        cursor.forEach(function(result){

                                 if(result != null) {

                                    transfer =  transfer + result.VersicherungsStatus+'°'+result.Name+'°'+result.Geburtsdatum+'°'+result.PLZWohnort+ '-->';

                                    if(n === cursor.length -1)
                                        dataReturn(transfer.substring(0,transfer.lastIndexOf('-->')));

                                   n++;
                                 } else
                                       dataReturn(transfer);

                        });

                } else if(arrv[0].endsWith('plz')) {

                    transfer = "";
                    var n = 0;

                    cursor = await collection
                                    .find({ PLZ_Ort: {$regex: arrv[2], $options: "i" } }).toArray();
                    cursor.forEach(function(result){

                                 if(result != null) {
                                    transfer =  transfer + result.PLZ_Ort + '-->';

                                    if(n === cursor.length -1)
                                       dataReturn(transfer.substring(0,transfer.lastIndexOf('-->')));

                                  n++;
                                 } else
                                       dataReturn(transfer);
                          });

                } else if(arrv[0].endsWith('medE')) {

                    transfer = "";
                    var n = 0;


                    var cursor = await collection
                          .find({isActive: 'true', [arrk[2]]: {$regex: arrv[2], $options: "i" }, [arrk[3]]: {$regex: arrv[3], $options: "i" } }).toArray();

                        cursor.forEach(function(result) {

                                   if(result != null) {

                                        transfer =  transfer + result.Name +'°'+  result.Tel +'°'+ result.Addresse +'°'+ result.Kassenzulassung +'°'+ result.Qualifikation + '-->';

                                        if(n === cursor.length -1)
                                           dataReturn(transfer.substring(0,transfer.lastIndexOf('-->')));

                                      n++;
                                   } else
                                         dataReturn(transfer);

                          });

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
                                   dataReturn(transfer.substring(0,transfer.lastIndexOf('-->')));
                               })
                               .catch(err=>console.log('insert failed: '+err))

                } else if(arrv[0].endsWith('diagnosen')) {
                          transfer = '' ;
                          var n = 0;
                          var cursor = await collection
                                                .find({$or: [{ICD10: {$regex:arrv[2]}}, {Diagnose: {$regex:arrv[2]}}]},{ _id: 0 }).toArray();

                              cursor.forEach(function(result){

                                         if(result != null) {
                                            transfer =  transfer + result.ICD10 +'°'+  result.Diagnose + '-->';
                                            if(n === cursor.length -1)
                                                dataReturn(transfer.substring(0,transfer.lastIndexOf('-->')));
                                            n++;
                                         } else
                                            dataReturn(transfer);
                              })

                } else if(arrv[0].endsWith('persSearch')) {
                         var transfer = '';
                         var n = 0;


                         var str = arrv[2] + '.' +arrk[3];

                         var cursor = await collection
                                              .find({ [str]: arrv[3] }).toArray();
                             cursor.forEach(data => {

                                          if(data != null) {

                                              for(var i in data) {
                                                  var key = i;
                                                  var val = data[i];

                                                  if(key == arrv[2]) {
                                                     var map = val.map(item => item.Autorisiert_von_Name+'°'+item.PatName+'°'+item.PatVersicherungsNummer+'°'+item.Typ +'-->');
                                                  }
                                              }

                                              if(n === cursor.length -1) {
                                                 transfer = transfer + map;
                                                 dataReturn(transfer.substring(0,transfer.lastIndexOf('-->')));
                                              }
                                             n++;
                                          } else
                                              dataReturn(transfer);

                             });

                } else if(arrv[0].endsWith('MonatsAbrechnung')) {
                         var transfer = '';
                         var n = 0;
                         var n1 = 0;

                         var Abr = await collection
                                            .find({[arrk[2]]: arrv[2]}).toArray();

                                   await Abr.forEach(data => {
                                                   if(data != null) {

                                                       for(var i in data) {
                                                           var key = i;
                                                           var val = data[i];

                                                           if(key == 'AbrechnungsDetails') {
                                                               for(var j in val) n1++;
                                                               for(var j in val) {
                                                                   var k1 = j;
                                                                   var v1 = val[j];

                                                                   for(var k in v1) {
                                                                       var k2 = k;
                                                                       var v2 = v1[k];

                                                                       for(var h in v2) {
                                                                           var k3 = h;
                                                                           var v3 = v2[h];
                                                                           if(v3.Rechnungsdatum != null && parseInt(v3.Rechnungsdatum) >= parseInt(arrv[3]) &&
                                                                                                           parseInt(v3.Rechnungsdatum) <= parseInt(arrv[4]))

                                                                              transfer = transfer + JSON.stringify(v2) +'-->';
                                                                       }

                                                                     n++;
                                                                   }

                                                                 if(n === n1) {
                                                                    transfer = transfer.replaceAll('},','}°');
                                                                    dataReturn(transfer.substring(0,transfer.lastIndexOf('-->')));
                                                                 }
                                                               }
                                                           }
                                                       }

                                                   } else
                                                       dataReturn(transfer);
                                          })

                }

            } catch (error) {
                    response.status(400).json({ error: error });
            }
      }
}

async function dataReturn (trans) {
       //console.dir('---'+trans+'....');
       await response.status(200).json({body: JSON.stringify(trans)});
}
