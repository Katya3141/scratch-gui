import {FormattedMessage} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';

import Box from '../box/box.jsx';
import LabelTile from './label-tile.jsx';
import Dots from './dots.jsx';

import bindAll from 'lodash.bindall';

import radarIcon from './icons/searching.png';
import refreshIcon from './icons/refresh.svg';

import styles from './ml-modal.css';

import ModalVideoManager from '../../lib/video/modal-video-manager.js';

class ExampleEditor extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleGoBack',
            'setCanvas',
            'handleLoaded',
            'handleAccess',
            'handleNewExample',
            'countdown',
            'createNewExamples',
            'takePictures',
            'takeSinglePicture'
        ]);
        this.state = {
            trainInfo: "Press Train when you're ready!",
            intervalHandler: null,
            loaded: false,
            access: false,
            training: false,
            countdown: true,
            multiPicture: true,
            capture: false,
            newExamples: []
        };
    }
    componentWillUnmount () {   //if the modal is closed, clear the interval handler and turn off the video
        clearInterval(this.state.intervalHandler);
        this.videoDevice.disableVideo();
    }
    handleGoBack () {    //go back to the previous screen (which might be the model editor or the label editor, depending on whether or not this is a new label)
        this.videoDevice.disableVideo();
        if (this.props.activeLabel in this.props.imageData) {
            this.props.onNewExamples(this.state.newExamples, false);
            this.props.onEditLabel(this.props.activeLabel);
        } else {
            this.props.onNewExamples(this.state.newExamples, true);
            this.props.onEditModel();
        }
    }
    setCanvas (canvas) {    //set up the video on the canvas
        this.canvas = canvas;
        if (this.canvas) {
            this.videoDevice = new ModalVideoManager(this.canvas);
            this.videoDevice.enableVideo(this.handleAccess, this.handleLoaded);
        }
    }
    handleLoaded () {   //change state when camera loaded
        this.setState ({
            loaded: true
        })
    }
    handleAccess () {   //change state when camera is given access
        this.setState ({
            access: true
        })
    }
    handleNewExample () {   //take pictures and call props.onNewExample with the new image data
        if(this.state.countdown) {
            this.setState({trainInfo: 3, training: true, intervalHandler: setInterval(this.countdown, 1000)});
        } else {
            this.createNewExamples();
        }
    }

    countdown () {  //handles countdown before training begins
        if (this.state.trainInfo > 1) {
            this.setState({trainInfo: this.state.trainInfo - 1});
        } else {
            clearInterval(this.state.intervalHandler);
            this.createNewExamples();
        }
    }

    createNewExamples () {  //calls either takePictures or takeSinglePicture depending on whether "take 10 pictures" is checked
        if (this.canvas) {
            if (this.state.multiPicture) {
                this.setState({trainInfo: "training..."});
                setTimeout(this.takePictures, 200, 10);
            } else {
                this.takeSinglePicture();
            }
        }
    }

    takePictures (numPictures) {    //recursive function to take multiple pictures and then go back to the model or label editor
        this.setState({capture: true}, () => {
            const frame = this.videoDevice._videoProvider.getFrame({
                format: 'image-data'
            });
            if (frame) {
                this.setState({newExamples: this.state.newExamples.concat([frame])}, () => {
                    if (numPictures === 1) {
                        setTimeout(this.handleGoBack, 200);
                    } else {
                        setTimeout(this.takePictures, 200, numPictures - 1);
                    }
                });
            }
        });
    }

    takeSinglePicture () {  //takes a single picture (different function from takePictures because it should stay in the example editor)
        this.setState({capture: true}, () => {
            const frame = this.videoDevice._videoProvider.getFrame({
                format: 'image-data'
            });
            if (frame) {
                this.setState({trainInfo: "Press Train when you're ready!", training: false, newExamples: this.state.newExamples.concat([frame])});
            }
        });
    }

    render () {
        return (
            <Box className={styles.body}>
                <Box className={styles.activityArea}>
                    <Box className={styles.verticalLayout}>
                        <Box className={styles.instructions}>
                            {this.state.trainInfo}
                        </Box>
                        <Box className={styles.canvasArea}>
                            <canvas
                                    height="720"
                                    className={styles.canvas}
                                    ref={this.setCanvas}
                                    width="960"
                            />
                            {this.state.access ?
                                (<div className={classNames(styles.loadingCameraMessage)}>{this.state.loaded ? null : "Loading Camera..."}</div>) :
                                (<div className={classNames(styles.loadingCameraMessage)}>We need your permission to use your camera</div>)}
                            {this.state.capture ? (
                                <div className={styles.flashOverlay} onAnimationEnd={() => {this.setState({ capture: false })}}/>
                            ) : null}
                        </Box>
                        <Box className={classNames(styles.instructions)}>
                            <Box className={classNames(styles.checkbox)}>
                                <input type="checkbox" onChange={() => {this.setState({countdown: !this.state.countdown})}} defaultChecked={this.state.countdown}/>
                                <div>Countdown timer</div>
                            </Box>
                            <Box className={classNames(styles.checkbox)}>
                                <input type="checkbox" onChange={() => {this.setState({multiPicture: !this.state.multiPicture})}} defaultChecked={this.state.multiPicture}/>
                                <div>Take 10 pictures</div>
                            </Box>
                        </Box>
                    </Box>
                </Box>
                <Box className={classNames(styles.bottomArea)}>
                    {this.state.training ?
                        null :
                        (<Box className={classNames(styles.bottomAreaItem, styles.buttonRow)}>
                            <button onClick={this.handleNewExample}>Train</button>
                            <button onClick={this.handleGoBack}>Back</button>
                        </Box>)}
                </Box>
            </Box>
        );
    }
}

ExampleEditor.propTypes = {
    onEditLabel: PropTypes.func,
    onEditModel: PropTypes.func,
    onNewExamples: PropTypes.func,
    activeLabel: PropTypes.string,
    imageData: PropTypes.object
};

export default ExampleEditor;
