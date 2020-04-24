import React, { Component } from 'react';
import { StyleSheet, View, Button, Text, Image, ScrollView, NativeEventEmitter, Platform } from 'react-native';
import Regula from 'react-native-document-reader-api';
import * as RNFS from 'react-native-fs';
import RadioGroup from 'react-native-radio-buttons-group';
import ImagePicker from 'react-native-image-picker';
import CheckBox from 'react-native-check-box';

const eventManager = new NativeEventEmitter(Regula.RNRegulaDocumentReader);

export default class App extends Component {

  constructor(props) {
    super(props);
    eventManager.addListener(
      'prepareDatabaseProgressChangeEvent',
      e => {
      console.log(e["msg"]);
      this.setState({fullName: e["msg"]});
      }
    );
    var licPath = Platform.OS === 'ios' ? (RNFS.MainBundlePath + "/regula.license") : "regula.license";
    var readFile = Platform.OS === 'ios' ? RNFS.readFile : RNFS.readFileAssets;
    Regula.RNRegulaDocumentReader.prepareDatabase("Full", (respond) => {
      console.log(respond);
      readFile(licPath, 'base64').then((res) => {
		this.setState({fullName: "Initializing..."});
        Regula.RNRegulaDocumentReader.initializeReader({
          licenseKey: res
        }, (respond) => {
          console.log(respond);
          Regula.RNRegulaDocumentReader.getCanRFID((canRfid)=>{
            if(canRfid){
              this.setState({canRfid: true});
              this.setState({canRfidTitle: ''});
            }
          });
          Regula.RNRegulaDocumentReader.getAvailableScenarios((jstring) => {
            var scenariosTemp = JSON.parse(jstring);
            var scenarios = [];
            for (var i in scenariosTemp) {
              scenarios.push({
                label: Regula.Scenario.fromJson(typeof scenariosTemp[i] === "string" ? JSON.parse(scenariosTemp[i]) : scenariosTemp[i]).name,
                value: i
              });
            }
            for (var i in this.state.scenarios) {
              this.state.scenarios[i]["disabled"] = true;
            }
            for (var i in scenarios) {
              for (var j in this.state.scenarios) {
                if (scenarios[i]["label"] === this.state.scenarios[j]["label"]) {
                  this.state.scenarios[j]["disabled"] = false;
                }
              }
            }
            var todelete = [];
            for (var j in this.state.scenarios) {
              if (this.state.scenarios[j]["disabled"] === true) {
                todelete.push(j);
              }
            }
            for (i = todelete.length - 1; i >= 0; i--) {
              this.state.scenarios.splice(todelete[i], 1);
            }
            this.forceUpdate();
            Regula.RNRegulaDocumentReader.getDocumentReaderIsReady((isReady)=>{
              if(isReady === true || isReady === "YES"){
                this.setState({fullName: "Ready"});
            }else{
              this.setState({fullName: "Failed"});
            }
            });
          });
        })
      });
  });

    this.state = {
      fullName: "Please wait...",
      doRfid: false,
      canRfid: false,
      canRfidTitle: '(unavailable)',
      scenarios: [
        {
          label: "Mrz",
          value: 0
        },
        {
          label: "Barcode",
          value: 1
        },
        {
          label: "Locate",
          value: 2
        },
        {
          label: "Ocr",
          value: 3
        },
        {
          label: "DocType",
          value: 4
        },
        {
          label: "MrzOrBarcode",
          value: 5
        },
        {
          label: "MrzOrLocate",
          value: 6
        },
        {
          label: "MrzAndLocate",
          value: 7
        },
        {
          label: "MrzOrOcr",
          value: 8
        },
        {
          label: "MrzOrBarcodeOrOcr",
          value: 9
        },
        {
          label: "LocateVisual_And_MrzOrOcr",
          value: 10
        },
        {
          label: "FullProcess",
          value: 11
        },
        {
          label: "Id3Rus",
          value: 12
        },
        {
          label: "Capture",
          value: 13
        }
      ],
      selectedScenario: "Mrz",
      portrait: require('./images/portrait.png'),
      docFront: require('./images/id.png')
    };
  }

  logResults(results) {
    console.log("=============================================");
    console.log("chipPage");
    console.log(results.chipPage);
    console.log("=============================================");
    console.log("overallResult");
    console.log(results.overallResult);
    console.log("=============================================");
    console.log("processingFinished");
    console.log(results.processingFinished);
    console.log("=============================================");
    console.log("morePagesAvailable");
    console.log(results.morePagesAvailable);
    console.log("=============================================");
    console.log("rfidResult");
    console.log(results.rfidResult);
    console.log("=============================================");
    console.log("highResolution");
    console.log(results.highResolution);
    console.log("=============================================");
    console.log("graphicResult");
    console.log(results.graphicResult);
    console.log("=============================================");
    console.log("textResult");
    console.log(results.textResult);
    console.log("=============================================");
    console.log("documentPosition");
    console.log(results.documentPosition);
    console.log("=============================================");
    console.log("barcodePosition");
    console.log(results.barcodePosition);
    console.log("=============================================");
    console.log("mrzPosition");
    console.log(results.mrzPosition);
    console.log("=============================================");
    console.log("imageQuality");
    console.log(results.imageQuality);
    console.log("=============================================");
    console.log("documentType");
    console.log(results.documentType);
    console.log("=============================================");
    console.log("jsonResult");
    console.log(results.jsonResult);
    console.log("=============================================");
    console.log("documentReaderNotification");
    console.log(results.documentReaderNotification);
    console.log("=============================================");
    console.log("rfidSessionData");
    console.log(results.rfidSessionData);
    console.log("=============================================");
    console.log("authenticityCheckList");
    console.log(results.authenticityCheckList);
    console.log("=============================================");
  }

  displayResults(results) {
    this.setState({ fullName: results.getTextFieldValueByType(Regula.Enum.eVisualFieldType.FT_SURNAME_AND_GIVEN_NAMES) });
    if (results.getGraphicFieldImageByType(207) != null) {
      var base64DocFront = "data:image/png;base64," + results.getGraphicFieldImageByType(Regula.Enum.eGraphicFieldType.GF_DOCUMENT_IMAGE);
      this.setState({ docFront: { uri: base64DocFront } });
    }
    if (results.getGraphicFieldImageByType(201) != null) {
      var base64Portrait = "data:image/png;base64," + results.getGraphicFieldImageByType(Regula.Enum.eGraphicFieldType.GF_PORTRAIT);
      this.setState({ portrait: { uri: base64Portrait } });
    }
    //this.logResults(results);
  }

  handleResults(jstring) {
    var results = Regula.DocumentReaderResults.fromJson(JSON.parse(jstring));
    if (this.state.doRfid && results != null && results.chipPage != 0) {
      accessKey = null;
      accessKey = results.getTextFieldValueByType(Regula.Enum.eVisualFieldType.FT_MRZ_STRINGS);
      if (accessKey != null && accessKey != "") {
        accessKey = accessKey.replace(/^/g, '').replace(/\n/g, '');
        Regula.RNRegulaDocumentReader.setRfidScenario({
          mrz: accessKey,
          pacePasswordType: Regula.Enum.eRFID_Password_Type.PPT_MRZ,
        }, () => { });
      } else {
        accessKey = null;
        accessKey = results.getTextFieldValueByType(159);
        if (accessKey != null && accessKey != "") {
          Regula.RNRegulaDocumentReader.setRfidScenario({
            password: accessKey,
            pacePasswordType: Regula.Enum.eRFID_Password_Type.PPT_CAN,
          }, () => { });
        }
      }
      Regula.RNRegulaDocumentReader.startRFIDReader((jstring) => {
        if (jstring.substring(0, 8) == "Success:")
          this.displayResults(Regula.DocumentReaderResults.fromJson(JSON.parse(jstring.substring(8))));
        else
          console.log(jstring);
      });
    } else {
      this.displayResults(results);
    }
  }

  render() {

    return (
      <View style={styles.container}>
        <Text style={{
          top: 1,
          left: 1,
          padding: 10,
          fontSize: 20,
        }}>
          {this.state.fullName}
        </Text>
        <View style={{ flexDirection: "row", padding: 5 }}>
          <View style={{ flexDirection: "column", alignItems: "center" }}>
            <Text style={{
              top: 1,
              right: 1,
              padding: 5,
            }}>
              Portrait
        </Text>
            <Image
              style={{
                height: 150,
                width: 150,
              }}
              source={this.state.portrait}
              resizeMode="contain"
            />
          </View>
          <View style={{ flexDirection: "column", alignItems: "center", padding: 5 }}>
            <Text style={{
              top: 1,
              right: 1,
              padding: 5,
            }}>
              Document image
        </Text>
            <Image
              style={{
                height: 150,
                width: 200,
              }}
              source={this.state.docFront}
              resizeMode="contain"
            />
          </View>
        </View>

        <ScrollView style={{ padding: 5, alignSelf: 'stretch' }}>
          <RadioGroup style={{ alignSelf: 'stretch' }} radioButtons={this.state.scenarios} onPress={(data) => {
            //this.setState({ data });
            var selectedItem;
            for (var index in data) {
              if (data[index]['selected']) {
                selectedItem = data[index]['label'];
              }
            }
            this.setState({ selectedScenario: selectedItem })
          }} />
        </ScrollView>

        <View style={{ flexDirection: 'row', padding: 5}}>
          <CheckBox
            isChecked={this.state.doRfid}
            onClick={() => {
              if(this.state.canRfid){
                this.setState({ doRfid: !this.state.doRfid })
              }
            }}
            disabled={!this.state.canRfid}
          />
          <Text style={{padding: 5}}>
            {'Process rfid reading'+this.state.canRfidTitle}
        </Text>
        </View>

        <View style={{ flexDirection: 'row' }}>
          <Button
            onPress={() => {
              Regula.RNRegulaDocumentReader.setConfig( {
                functionality: {
                  videoCaptureMotionControl: true,
                  showCaptureButton: true
                },
                customization: {
                  showResultStatusMessages: true,
                  showStatusMessages: true
                },
                processParams: {
                  scenario: this.state.selectedScenario,
                  doRfid: this.state.doRfid,
                },
              },(str)=>{console.log(str)});
              Regula.RNRegulaDocumentReader.showScanner(
                (jstring) => {
                  if (jstring.substring(0, 8) == "Success:")
                    this.handleResults(jstring.substring(8));
                  else
                    console.log(jstring);
                });
            }}
            title="Scan document"
          />
          <Text style={{ padding: 5 }}></Text>
          <Button
            onPress={() => {
              ImagePicker.showImagePicker({}, (response) => {
                if (response.didCancel) {
                  console.log('User cancelled image picker');
                } else if (response.error) {
                  console.log('ImagePicker Error: ', response.error);
                } else if (response.customButton) { } else {
                  Regula.RNRegulaDocumentReader.setConfig( {
                    functionality: {
                      videoCaptureMotionControl: true,
                      showCaptureButton: true
                    },
                    customization: {
                      showResultStatusMessages: true,
                      showStatusMessages: true
                    },
                    processParams: {
                      scenario: this.state.selectedScenario,
                      doRfid: this.state.doRfid,
                    },
                  },(str)=>{console.log(str)});
                  Regula.RNRegulaDocumentReader.recognizeImage(
                    response.data,
                    (jstring) => {
                      if (jstring.substring(0, 8) == "Success:")
                        this.handleResults(jstring.substring(8));
                      else
                        console.log(jstring);
                    });
                }
              });
            }}
            title="     Scan image     "
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
    marginBottom: 12,
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});
