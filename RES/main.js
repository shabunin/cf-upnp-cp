
CF.userMain = function() {
    CF.log('STARTING UPNP');
    //starting UPnP_devices
    CF.watch(CF.FeedbackMatchedEvent, UPnP_devices.broadcastSysName, "ANSWER_BCAST", UPnP_devices.contentDirectoryFeedback);

}