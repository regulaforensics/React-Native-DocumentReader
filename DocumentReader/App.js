import React, { Component } from 'react';
import { StyleSheet, View, Button, Text, Image, ScrollView, NativeEventEmitter, Platform } from 'react-native';
import Regula from 'react-native-document-reader-api-beta';
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
        this.setState({ fullName: e["msg"] });
      }
    );
    var licPath = Platform.OS === 'ios' ? (RNFS.MainBundlePath + "/regula.license") : "regula.license";
    var readFile = Platform.OS === 'ios' ? RNFS.readFile : RNFS.readFileAssets;
    Regula.RNRegulaDocumentReader.prepareDatabase("Full", (respond) => {
      console.log(respond);
      readFile(licPath, 'base64').then((res) => {
        this.setState({ fullName: "Initializing..." });
        Regula.RNRegulaDocumentReader.initializeReader({
          licenseKey: res
        }, (respond) => {
          console.log(respond);
          Regula.RNRegulaDocumentReader.isRFIDAvailableForUse((canRfid) => {
            if (canRfid) {
              this.setState({ canRfid: true });
              this.setState({ canRfidTitle: '' });
            }
          });
          Regula.RNRegulaDocumentReader.getAvailableScenarios((jstring) => {
            var scenariosTemp = JSON.parse(jstring);
            var scenariosL = [];
            for (var i in scenariosTemp) {
              scenariosL.push({
                label: Regula.Scenario.fromJson(typeof scenariosTemp[i] === "string" ? JSON.parse(scenariosTemp[i]) : scenariosTemp[i]).name,
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
            Regula.RNRegulaDocumentReader.getDocumentReaderIsReady((isReady) => {
              if (isReady === true || isReady === "YES") {
                this.setState({ fullName: "Ready" });
              } else {
                this.setState({ fullName: "Failed" });
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
      scenarios: [],
      selectedScenario: "",
      portrait: require('./images/portrait.png'),
      docFront: require('./images/id.png'),
      radio: <RadioGroup style={{ alignSelf: 'stretch' }} radioButtons={[{ label: 'Loading', value: 0 }]} onPress={null} />
    };
  }

  displayResults(results) {
    this.setState({ fullName: "", docFront: require('./images/id.png'), portrait: require('./images/portrait.png') });
    this.setState({ fullName: results.getTextFieldValueByType(Regula.Enum.eVisualFieldType.FT_SURNAME_AND_GIVEN_NAMES) });
    if (results.getGraphicFieldImageByType(207) != null) {
      var base64DocFront = "data:image/png;base64," + results.getGraphicFieldImageByType(Regula.Enum.eGraphicFieldType.GF_DOCUMENT_IMAGE);
      this.setState({ docFront: { uri: base64DocFront } });
    }
    if (results.getGraphicFieldImageByType(201) != null) {
      var base64Portrait = "data:image/png;base64," + results.getGraphicFieldImageByType(Regula.Enum.eGraphicFieldType.GF_PORTRAIT);
      this.setState({ portrait: { uri: base64Portrait } });
    }
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
    } else
      this.displayResults(results);
  }

  render() {
    return (
      <View style={styles.container}>
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
              Regula.RNRegulaDocumentReader.setConfig({
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
              }, (str) => { console.log(str) });
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
                  Regula.RNRegulaDocumentReader.setConfig({
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
                  }, (str) => { console.log(str) });
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
