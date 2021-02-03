import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Button,
  Alert
} from 'react-native';
import { connect } from 'react-redux';
import Carousel, { Pagination } from 'react-native-snap-carousel';
import Switch from 'react-native-customisable-switch';
import LinearGradient from 'react-native-linear-gradient';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCheck, faCheckCircle, faTimesCircle, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { Color, BasicStyles, Routes  } from 'common';
import MixCard from './mixCard';
import Style from './Style.js';
import SlidingButton from 'modules/generic/SlidingButton';
import MixConfirmationModal from 'modules/modal/MixConfirmation';
import Draggable from 'react-native-draggable';
import { Spinner } from 'components';
import Styles from 'modules/generic/OrderCardStyle';
import Api from 'services/api/index.js';
import Message from 'modules/modal/MessageModal.js';
const width = Math.round(Dimensions.get('window').width);
const height = Math.round(Dimensions.get('window').height);

const availablePaddocks = [
  {
    id: 1,
    name: 'A5',
    crop: 'WHEAT',
    area: 5,
    unit: 'ha',
    remaining_area: 5,
    partial: false,
    partial_flag: true
  },
  {
    id: 2,
    name: 'B6',
    crop: 'WHEAT',
    area: 6,
    unit: 'ha',
    remaining_area: 6,
    partial: false,
    partial_flag: false
  },
  {
    id: 3,
    name: 'C7',
    crop: 'WHEAT',
    area: 7,
    unit: 'ha',
    remaining_area: 7,
    partial: false,
    partial_flag: false
  },
  {
    id: 4,
    name: 'D8',
    crop: 'WHEAT',
    area: 8,
    unit: 'ha',
    remaining_area: 8,
    partial: false,
    partial_flag: false
  },
  {
    id: 5,
    name: 'E9',
    crop: 'WHEAT',
    area: 9,
    unit: 'ha',
    remaining_area: 9,
    partial: false,
    partial_flag: false
  },
]

const MixPage = (props) => {

  const carouselRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [scanProductFlag, setScanProductFlag] = useState(true)
  const [selectedFlag, setSelectedFlag ] = useState(false)
  const [appRateSwitch, setAppRateSwitch] = useState(false)
  const [availablePaddockIndex, setAvailablePaddockIndex] = useState(0)
  const [selectedPaddockIndex, setSelectedPaddockIndex] = useState(0)
  const [mixConfirmation, setMixConfirmation] = useState(false)
  const [selectedPaddock, setSelectedPaddock] = useState([])
  const [totalArea, setTotalArea] = useState(0)
  const [paddocks, setPaddocks] = useState([])
  const [maxArea, setMaxArea] = useState(0)
  const [appliedRate, setAppliedRate] = useState(0)
  const [message, setMessage] = useState(false)
  const [totalHigher, setTotalHigher] = useState(false)
  const [test, setTest] = useState(0)
  const { task } = props.state;

  // THIS IS A FIX FOR NOT RENDERING THE PADDOCK CARDS ONCE THIS COMPONENT IS MOUNTED
  useEffect(() => {
    setTimeout(() => {
      const { task } = props.state;
      setLoading(false)
      setMaxArea(parseFloat(task.machine.capacity / task.spray_mix.application_rate).toFixed(2))
      retrieve()
    }, 100)
  }, [])

  const newRates = async() => {
    if(setMaxArea(parseFloat(task.machine.capacity / parseInt(test)).toFixed(2)) < totalArea){
      await setTotalHigher(true)
      await setMaxArea(parseFloat(task.machine.capacity / parseInt(test)).toFixed(2))
    }else{
      await setTotalHigher(false)
      await setMaxArea(parseFloat(task.machine.capacity / parseInt(test)).toFixed(2))
    }
  }

  const onload = () => {
    setTimeout(() => {
      setAppRateSwitch(!appRateSwitch)
      if(!appRateSwitch){
        setAppliedRate(Math.round(task.machine.capacity / totalArea))
        if(test == 0 || test == ''){
          setMaxArea(parseFloat(task.machine.capacity / task.spray_mix.minimum_rate).toFixed(2))
        }else{
          setMaxArea(parseFloat(task.machine.capacity / parseInt(test)).toFixed(2))
        }
        if(totalArea > maxArea){
          setTotalHigher(true)
          setMessage(true)
        }
      }else{
        setMaxArea(parseFloat(task.machine.capacity / task.spray_mix.application_rate).toFixed(2))
        setAppliedRate(Math.round(task.spray_mix.application_rate))
        setTimeout(() => {
          if(totalArea > maxArea){
            setTotalHigher(true)
          }
        }, 25)
      }
    }, 25)
  }

  const closeModal = () =>{
    setMessage(false)
    setAppRateSwitch(!appRateSwitch)
    if(totalArea <= maxArea){
      setTotalHigher(false)
    }else {
      setTotalHigher(true)
    }
  }
 
  const retrieve = () => {
    const { task, user } = props.state;
    if (user == null || task == null || (task && task.spray_mix == null)) {
      return
    }
    const parameter = {
      merchant_id: user.sub_account.merchant.id,
      spray_mix_id: task.spray_mix.id
    };
    setLoading(true)
    Api.request(Routes.paddockPlanTasksRetrieveAvailablePaddocks, parameter, response => {
        setLoading(false)
        if(response.data !== null && response.data.length > 0){
          setPaddocks(response.data)
        }else{
          setPaddocks([])
        }
      },
      error => {
        setLoading(false)
        setPaddocks([])
        console.log({error});
      },
    );
  }

  const redirect = (route) => {
    const { task } = props.state;
    props.setTask({
      ...task,
      data: selectedPaddock,
      params: {
        volume: 120,
        units: 'L',
        area: 64,
        area_units: 'HA'
      }
    })
    setTimeout(() => {
      setMixConfirmation(false)
      props.navigation.navigate(route, {max_area: maxArea, application_rate: appliedRate})
    }, 100)
  }

  const removePaddock = (from, item) => {
    item.partial = false;
    // setTotalArea(item.area + totalArea)
    if(from == 'selected'){
      const newSelectedPaddock = selectedPaddock.filter((paddock, idx) => {
      if(paddock.id != item.id){
          return item
        }
      })
      // setTotalArea(totalArea - item.area)
      setTotalArea(totalArea - item.remaining_area)
      setSelectedPaddock(newSelectedPaddock)
      setPaddocks([...paddocks, ...[item]])
    }else{
      const newPaddocks = paddocks.filter((paddock, idx) => {
        if(paddock.id != item.id){
          return item
        }
      })
      setPaddocks((newPaddocks != null && newPaddocks.length > 0) ? newPaddocks : [])
    }
  }

  const getTotalArea = () => {
    let total = 0
    for (var i = 0; i < selectedPaddock.length; i++) {
      let item = selectedPaddock[i]
      total = total + item.area
      setTotalArea(total)
    }
  }

  const addToSelected = (item) => {
    setSelectedFlag(true)
    let status = false
    for (var i = 0; i < selectedPaddock.length; i++) {
      let paddock = selectedPaddock[i]
      if(paddock.id == item.id){
        status = true
        break
      }
    }
    if(status == false){
      if(maxArea <= totalArea){
          setTotalHigher(true)
          // Alert.alert(
          //   'Error Message',
          //   'Now Allowed! Total area is greater than the max area.',
          //   [
          //     { text: 'OK', onPress: () => console.log('OK Pressed') }
          //   ],
          //   { cancelable: false }
          // );
      }else if(maxArea >= (item.area + totalArea)){
        setTotalArea(totalArea + item.area)
        setTimeout(() => {
          setSelectedPaddock([...selectedPaddock, ...[item]])  
          removePaddock('available', item)
        }, 100)  
      }else{
        let remainingArea = maxArea - totalArea
        let newItem = {
          ...item,
          remaining_area: remainingArea,
          partial_flag: true
        }
        setTotalArea(totalArea + remainingArea)
        setTimeout(() => {
          setSelectedPaddock([...selectedPaddock, ...[newItem]])
          removePaddock('available', item)
        }, 100)
      }
      
    }else{
      console.log('already existed')
      Alert.alert(
        'Error Message',
        item.name + ' already exist!',
        [
          { text: 'OK', onPress: () => console.log('OK Pressed') }
        ],
        { cancelable: false }
      );
    }

  }

  const partialChange = (item) => {
    const newSelectedPaddock = selectedPaddock.map((paddock, index) => {
      if(paddock.id == item.id){
        return {
          ...paddock,
          partial: !paddock.partial
        }
      }else{
        return paddock
      }
    })
    setSelectedPaddock(newSelectedPaddock)
  }

  const selectedPaddockView = () => {
    return(
      <View style={{
        marginBottom: 100
      }}>
        <Text style={Style.textHeader}>Selected Paddocks</Text>
        <View style={{ alignItems: 'center', position: 'relative' }}>
          <Carousel
            layout={"default"}
            ref={carouselRef}
            data={selectedPaddock}
            sliderWidth={width}
            itemWidth={width * 0.9}
            renderItem={(data) => (
              <MixCard data={data}
              totalRate={totalArea}
              maxRate={maxArea}
              hasCheck={true}
              addToSelected={() => {}}
              removePaddock={(from, item) => removePaddock(from, item)}
              
                from={'selected'}
                params={{
                  totalArea,
                  maxArea
                }}
                onPartialChange={(item) => partialChange(item)}

                />
            )}
            onSnapToItem = { index => setSelectedPaddockIndex(index) }
          />
          <Pagination
            dotsLength={selectedPaddock.length}
            activeDotIndex={selectedPaddockIndex}
            containerStyle={{ 
              width: '50%',
              position: 'absolute',
              bottom: -40,
            }}
            dotStyle={{
              width: 10,
              height: 10,
              borderRadius: 5,
              marginHorizontal: -5,
              backgroundColor: '#5A84EE'
            }}
            inactiveDotStyle={{
              backgroundColor: '#C4C4C4'
            }}
            inactiveDotOpacity={0.4}
            inactiveDotScale={0.6}
          />
        </View>
      </View>
    )
  }


  const applicationRate = () => {
    const { task } = props.state;
    return (
        <View style={[
          Style.mixCardContainer,
          {
            marginTop: 25,
            minHeight: 50,
            width: '90%',
            marginLeft: '5%',
            marginRight: '5%',
            zIndex: 1,
            // marginBottom: 70
            marginBottom: (selectedPaddock.length == 0 || (selectedPaddock.length > 0 &&  selectedFlag == false)) ? (height / 2) : 0
          }]
        }>
          <View style={
            [ Style.mixTitle, 
            { borderBottomWidth: 3, borderBottomColor: '#9AD267' }]
          }>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[Style.textBold, { marginRight: 5, fontSize: BasicStyles.standardTitleFontSize }]}>
                Application rate
              </Text>
              <FontAwesomeIcon
                size={16}
                icon={faCheckCircle}
                color={'#BBF486'}
              />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: -15 }}>
              <Text style={{ fontSize: BasicStyles.standardFontSize, marginLeft: 20, marginRight: 5 }}>Last Load?</Text>
              <Switch
                value={appRateSwitch}
                onChangeValue={() => onload()}
                activeText={'ON'}
                inactiveText={'OFF'}
                fontSize={BasicStyles.standardFontSize}
                activeTextColor={'rgba(255, 255, 255, 1)'}
                inactiveTextColor={'rgba(255, 255, 255, 1)'}
                activeBackgroundColor={'#9AD267'}
                inactiveBackgroundColor={'#C6C6C6'}
                activeButtonBackgroundColor={'rgba(255, 255, 255, 1)'}
                inactiveButtonBackgroundColor={'#F2F2F2'}
                switchHeight={25}
                switchBorderRadius={5}
                buttonWidth={30}
                buttonHeight={20}
                buttonBorderRadius={5}
                animationTime={150}
                padding={true}
              />
              <View style={{ marginLeft: 34 }}
              >
                {message === true ?
                  <Message
                    visible={true}
                    title={'Application volume too low'}
                    message={`This task would require an application volume lower than ${appliedRate} L, which is too low for this spray mix. \n\n\t Remove paddock or complete a partial application`}
                    onClose={() => closeModal()}
                  /> : null }
              </View>
            </View>
          </View>
          <View style={[Style.mixDetails, { flexDirection: 'column' }]}>
            <View style={Style.appliedRate}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                { appRateSwitch === false ?
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <LinearGradient
                  colors={['#ABD770', '#D3E584']}
                  style={{
                    height: 15,
                    width: 15,
                    borderRadius: 7.5,
                    marginRight: 5
                  }}
                  />
                  <Text style={{
                    fontSize: BasicStyles.standardFontSize
                  }}>Applied Rate</Text>
                </View>
                  :
                  <View style={{flexDirection:'row'}}>
                    <TextInput 
                        style={[Style.searchInput, { 
                          opacity: 5, 
                          borderColor: 'grey', 
                          borderWidth: 1, 
                          color: 'grey', 
                          marginRight: -5, 
                          height: 35,
                          borderTopLeftRadius: 10, 
                          borderTopRightRadius: 10,
                          borderBottomRightRadius: 10,
                          borderBottomLeftRadius: 10 }]}
                        keyboardType={'numeric'}
                        onChangeText={(newRate) => setTest(newRate)}
                        value={test}
                        placeholderTextColor='grey'
                        underlineColorAndroid='grey'
                        placeholder={appliedRate.toString()}>
                    </TextInput>
                    <TouchableOpacity>
                    <Button
                      title="Confirm"
                      onPress={() => newRates()}>
                    </Button>
                    </TouchableOpacity>
                  </View>
                }
              </View>
              <View>
                { (task && task.spray_mix && !appRateSwitch) && (
                    <Text style={[Style.textBold, {
                      fontSize: BasicStyles.standardFontSize
                    }]}>{task.spray_mix.application_rate} L</Text>
                  )
                }
              </View>
            </View>
            <View style={{ width: '100%', flex: 1, alignItems: 'flex-start' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                {totalHigher === false ?
                  <View style={Style.totalAreaBox}>
                    <Text style={{
                      fontSize: BasicStyles.standardFontSize
                    }}>{totalArea} Ha</Text>
                    <Text style={{ color: '#5A84EE', fontWeight: 'bold', fontSize: BasicStyles.standardFontSize }}>
                      TOTAL AREA
                    </Text>
                  </View> :
                  <View style={[Style.totalAreaBox, {borderColor: '#FF0000'}]}>
                    <Text style={{
                      fontSize: BasicStyles.standardFontSize, color: '#FF0000'
                    }}>{totalArea} Ha</Text>
                    <Text style={{ color: '#FF0000', fontWeight: 'bold', fontSize: BasicStyles.standardFontSize }}>
                      TOTAL AREA
                    </Text>
                  </View>
                }
                {
                  (selectedPaddock.length > 0) && (
                    <View style={{
                      flexDirection: 'column',
                      width: '100%',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      marginTop: -25,
                      paddingLeft: 15
                    }}>
                      {
                        selectedPaddock.map((item, index) => (
                          <View 
                          style={[Style.appliedPaddock, {
                            width: '40%',
                            justifyContent: 'space-between',
                          }]}
                          >
                          {
                            item.name && (
                              <Text style={[Style.appliedPaddockText, {
                                fontSize: BasicStyles.standardTitleFontSize
                                }]}>
                                  {item.name}
                                </Text>
                            )
                          }
                        
                          <TouchableOpacity
                            style={{
                              width: 5,
                              alignItems: 'flex-end'
                            }}
                            onPress={() => removePaddock('selected', item)}
                            >
                            <FontAwesomeIcon size={12} icon={faTimesCircle} color={'#094EFF'} />
                          </TouchableOpacity>
                        </View>
                        ))
                      } 
                    </View>
                  )
                }
              </View>
              {
                (task && task.machine) && (
                  <View style={{ marginTop: 5, paddingLeft: 0 }}>
                    <Text style={{ color: '#5A84EE', fontWeight: 'bold', fontSize: BasicStyles.standardFontSize }}>
                      MAX AREA: {maxArea}HA
                    </Text>
                  </View>    
                )
              }
            </View>
          </View>
          {
            (selectedPaddock.length > 0) && (
              <TouchableOpacity
                style={{
                  alignItems: 'center',
                  width: '100%',
                  backgroundColor: selectedFlag ? '#676767' : Color.blue,
                  borderBottomLeftRadius: BasicStyles.standardBorderRadius,
                  borderBottomRightRadius: BasicStyles.standardBorderRadius,
                }}
                onPress={() => setSelectedFlag(selectedFlag ? false : true) }
                >
                  <Text style={{
                    fontSize: BasicStyles.standardTitleFontSize,
                    fontWeight: 'bold',
                    paddingTop: 10,
                    paddingBottom: 10,
                    color: Color.white
                  }}>
                    {
                      selectedFlag ? 'Hide paddock details' : 'Show paddock details'
                    }
                  </Text>
              </TouchableOpacity>
            )
          }
        </View>
      );
  }

  const availablePaddocksView = () => {
    return(
      <View style={{
          marginTop: 15
        }}>
        <Text style={Style.textHeader}>Available Paddocks</Text>
        <View style={{ alignItems: 'center', position: 'relative' }}>

           <Carousel
              layout={"default"}
              ref={carouselRef}
              data={paddocks}
              sliderWidth={width}
              itemWidth={width * 0.9}
              activeDo
              renderItem={(data) => (
                  <MixCard data={data}
                    hasCheck={false}
                    addToSelected={(item) => addToSelected(item)}
                    from={'available'}
                    removePaddock={(from, item) => removePaddock(from, item)}
                    />
              )}
              onSnapToItem = { index => setAvailablePaddockIndex(index) }
            />

          <Text style={{
            position: 'absolute',
            bottom: -12,
            left: '5%',
            fontSize: 10,
            color: '#C0C0C0',
            // width: 100
          }}>
            Drag Paddock tile to Application Box
          </Text>
          {
            paddocks.length < 10 && (
              <Pagination
                dotsLength={paddocks.length}
                activeDotIndex={availablePaddockIndex}
                containerStyle={{ 
                  width: '50%',
                  position: 'absolute',
                  bottom: -40,
                }}
                dotStyle={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  marginHorizontal: -5,
                  backgroundColor: '#5A84EE'
                }}
                inactiveDotStyle={{
                  backgroundColor: '#C4C4C4'
                }}
                inactiveDotOpacity={0.4}
                inactiveDotScale={0.6}
              />
            )
          }
          {
            paddocks.length >= 10 && (
              <Text style={{

              }}>
                { (availablePaddockIndex + 1) + ' / ' + paddocks.length}
              </Text>
            )
          }
          
        </View>
      </View>
    )
  }


  return (
    <SafeAreaView style={{ flex: 1, position: 'relative', backgroundColor:  Color.containerBackground}}>
      <ScrollView showsVerticalScrollIndicator={false} style={Style.ScrollView}>

        {(paddocks != null && paddocks.length > 0) && availablePaddocksView()}
       
        {applicationRate()}

        { (selectedFlag && selectedPaddock.length > 0) && ( selectedPaddockView()) }


      </ScrollView>
      {
        scanProductFlag && (
          <SlidingButton
            title={'Create Batch'}
            label={'Swipe Right'}
            position={mixConfirmation}
            onSuccess={() => {
              setMixConfirmation(true)
            }}
          />
        )
      }

      {
        (mixConfirmation) && (
          <MixConfirmationModal
            visible={mixConfirmation}
            onClose={() => {
              setMixConfirmation(false)
            }}
            onSuccess={() => redirect('batchStack')}
            data={selectedPaddock}
            volume={'BATCH ' + totalArea + 'HA ' + parseFloat(task.machine.capacity * totalArea).toFixed(2) + ' L'}
          />
        )
      }
      {loading ? <Spinner mode="overlay" /> : null}
    </SafeAreaView>
  );
}
const mapStateToProps = state => ({state: state});
const mapDispatchToProps = dispatch => {
  const {actions} = require('@redux');
  return {
    setTask: (task) => dispatch(actions.setPaddock(task)),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(MixPage);