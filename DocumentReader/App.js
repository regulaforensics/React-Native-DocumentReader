import React, { Component } from 'react';
import { StyleSheet, View, Button, Text, Image, ScrollView, NativeEventEmitter, Platform } from 'react-native';
import Regula from 'react-native-document-reader-api-beta';
import * as RNFS from 'react-native-fs';
import RadioGroup from 'react-native-radio-buttons-group';
import ImagePicker from 'react-native-customized-image-picker';
import CheckBox from 'react-native-check-box';

const eventManager = new NativeEventEmitter(Regula.RNRegulaDocumentReader);

export default class App extends Component {
  constructor(props) {
    super(props);
    eventManager.addListener('prepareDatabaseProgressChangeEvent', e => this.setState({ fullName: e["msg"] }));
    eventManager.addListener('completionEvent', e => this.handleCompletion(Regula.DocumentReader.DocumentReaderCompletion.fromJson(JSON.parse(e["msg"]))));
    var licPath = Platform.OS === 'ios' ? (RNFS.MainBundlePath + "/regula.license") : "regula.license";
    var readFile = Platform.OS === 'ios' ? RNFS.readFile : RNFS.readFileAssets; 
    Regula.DocumentReader.prepareDatabase("Full", (respond) => {
      console.log(respond);
      readFile(licPath, 'base64').then((res) => {
        this.setState({ fullName: "Initializing..." });
        Regula.DocumentReader.initializeReader(res, (respond) => {
          console.log(respond);
          Regula.DocumentReader.isRFIDAvailableForUse((canRfid) => {
            if (canRfid) {
              this.setState({ canRfid: true });
              this.setState({ canRfidTitle: '' });
            }
          }, error => console.log(error));
          Regula.DocumentReader.getAvailableScenarios((jstring) => {
            var scenariosTemp = JSON.parse(jstring);
            var scenariosL = [];
            for (var i in scenariosTemp) {
              scenariosL.push({
                label: Regula.DocumentReader.Scenario.fromJson(typeof scenariosTemp[i] === "string" ? JSON.parse(scenariosTemp[i]) : scenariosTemp[i]).name,
                value: i
              });
            }
            this.setState({ scenarios: scenariosL });
            this.setState({ selectedScenario: this.state.scenarios[0]['label'] });
            this.setState({ radio: null })
            this.setState({
              radio: <RadioGroup style={{ alignSelf: 'stretch' }} radioButtons={this.state.scenarios} onPress={(data) => {
                var selectedItem;
                for (var index in data)
                  if (data[index]['selected'])
                    selectedItem = data[index]['label'];
                this.setState({ selectedScenario: selectedItem })
              }} />
            });
            Regula.DocumentReader.getDocumentReaderIsReady((isReady) => {
              if (isReady)
                this.setState({ fullName: "Ready" });
              else
                this.setState({ fullName: "Failed" });
            }, error => console.log(error));
          }, error => console.log(error));
        }, error => console.log(error));
      });
    }, error => console.log(error));

    this.state = {
      fullName: "Please wait...",
      doRfid: false,
      canRfid: false,
      canRfidTitle: '(unavailable)',
      scenarios: [],
      selectedScenario: "",
      portrait: require('./images/portrait.png'),
      docFront: require('./images/id.png'),
      radio: <RadioGroup style={{ alignSelf: 'stretch' }} radioButtons={[{ label: 'Loading', value: 0 }]} onPress={null} />
    };
  }

  handleCompletion(completion) {
    console.log("action code: " + completion.action)
    if (completion.action == Regula.DocumentReader.Enum.DocReaderAction.COMPLETE)
      this.handleResults(completion.results)
    if (completion.action == Regula.DocumentReader.Enum.DocReaderAction.CANCEL)
      console.log("scanning canceled")
    if (completion.action == Regula.DocumentReader.Enum.DocReaderAction.ERROR)
      console.log("Error: " + completion.error.toString)
    if (completion.action == Regula.DocumentReader.Enum.DocReaderAction.COMPLETE || Regula.DocumentReader.Enum.DocReaderAction.CANCEL || Regula.DocumentReader.Enum.DocReaderAction.ERROR)
      this.hideRfidUI()
    if (completion.action == Regula.DocumentReader.Enum.DocReaderAction.NOTIFICATION && this.state.isReadingRfid)
      updateRfidUI(completion.results)
  }

  showRfidUI() {
    // show animation
    console.log("displaying rfid ui")
    this.setState({ isReadingRfid: true });
  }

  hideRfidUI() {
    // show animation
    this.setState({ isReadingRfid: false });
  }

  updateRfidUI(results) {
    // update progress bar
  }

  displayResults(results) {
    this.setState({ fullName: "", docFront: require('./images/id.png'), portrait: require('./images/portrait.png') });
    this.setState({ fullName: results.getTextFieldValueByType(Regula.DocumentReader.Enum.eVisualFieldType.FT_SURNAME_AND_GIVEN_NAMES) });
    if (results.getGraphicFieldImageByType(Regula.DocumentReader.Enum.eGraphicFieldType.GF_DOCUMENT_IMAGE) != null) {
      var base64DocFront = "data:image/png;base64," + results.getGraphicFieldImageByType(Regula.DocumentReader.Enum.eGraphicFieldType.GF_DOCUMENT_IMAGE);
      this.setState({ docFront: { uri: base64DocFront } });
    }
    if (results.getGraphicFieldImageByType(Regula.DocumentReader.Enum.eGraphicFieldType.GF_PORTRAIT) != null) {
      var base64Portrait = "data:image/png;base64," + results.getGraphicFieldImageByType(Regula.DocumentReader.Enum.eGraphicFieldType.GF_PORTRAIT);
      this.setState({ portrait: { uri: base64Portrait } });
    }
  }

  handleResults(results) {
    if (this.state.doRfid && results != null && results.chipPage != 0) {
      accessKey = null;
      accessKey = results.getTextFieldValueByType(Regula.DocumentReader.Enum.eVisualFieldType.FT_MRZ_STRINGS);
      if (accessKey != null && accessKey != "") {
        accessKey = accessKey.replace(/^/g, '').replace(/\n/g, '');
        Regula.DocumentReader.setRfidScenario({
          mrz: accessKey,
          pacePasswordType: Regula.DocumentReader.Enum.eRFID_Password_Type.PPT_MRZ,
        }, e => { this.showRfidUI() }, error => console.log(error));
      } else {
        accessKey = null;
        accessKey = results.getTextFieldValueByType(159);
        if (accessKey != null && accessKey != "") {
          Regula.DocumentReader.setRfidScenario({
            password: accessKey,
            pacePasswordType: Regula.DocumentReader.Enum.eRFID_Password_Type.PPT_CAN,
          }, e => { this.showRfidUI()  }, error => console.log(error));
        }
      }
      Regula.DocumentReader.readRFID(m => { }, e => console.log(e));

    } else
      this.displayResults(results);
  }

  render() {
    return (
      <View style={styles.container}>
        {this.state.isReadingRfid && <Text style={{
            top: 1,
            left: 1,
            padding: 30,
            fontSize: 20,
          }}>
            Reading RFID
          </Text>
        }
        { !this.state.isReadingRfid && <View style={styles.container}>
          <Text style={{
            top: 1,
            left: 1,
            padding: 30,
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
            {this.state.radio}
          </ScrollView>

          <View style={{ flexDirection: 'row', padding: 5 }}>
            <CheckBox
              isChecked={this.state.doRfid}
              onClick={() => {
                if (this.state.canRfid) {
                  this.setState({ doRfid: !this.state.doRfid })
                }
              }}
              disabled={!this.state.canRfid}
            />
            <Text style={{ padding: 5 }}>
              {'Process rfid reading' + this.state.canRfidTitle}
            </Text>
          </View>

          <View style={{ flexDirection: 'row' }}>
            <Button
              onPress={() => {
                Regula.DocumentReader.setConfig({
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
                }, e => { }, error => console.log(error));

                Regula.DocumentReader.showScanner(s => { }, e => console.log(e));
              }}
              title="Scan document"
            />
            <Text style={{ padding: 5 }}></Text>
            <Button
              onPress={() => {
                ImagePicker.openPicker({
                  multiple: true,
                  includeBase64: true
                }).then(response => {
                  Regula.DocumentReader.setConfig({
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
                  }, e => { }, error => console.log(error));

                  var images = [];

                  for (var i = 0; i < response.length; i++) {
                    images.push(response[i].data);
                  }

                  Regula.DocumentReader.recognizeImages(images, s => this.handleResults(s), e => console.log(e));
                }).catch(e => {
                  console.log("ImagePicker: " + e);
                });
              }}
              title="     Scan image     "
            />
          </View>
        </View>
        }
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
