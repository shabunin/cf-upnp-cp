// Vladimir Shabunin 
// va.shabunin@physics.msu.ru


//constantes
var cALL = 'ssdp:all';
var cROOTDEVICE = 'upnp:rootdevice';
var cCONTENTDIR = 'urn:schemas-upnp-org:service:ContentDirectory:1';
var cMEDIARENDERER = 'urn:schemas-upnp-org:device:MediaRenderer:1';
var cRENDERINGCONTROL = 'urn:schemas-upnp-org:service:RenderingControl:1';
var cAVTRANSPORT = 'urn:schemas-upnp-org:service:AVTransport:1';
var cSTORAGEFOLDER = 'object.container.storageFolder';
var cCONNECTIONMANAGER = 'urn:schemas-upnp-org:service:ConnectionManager:1';

var soapPRE = '<?xml version="1.0" encoding="utf-8"?>' +
    '<s:Envelope s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/" xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">' +
    '<s:Body>';
var soapEND = '</s:Body></s:Envelope>';


var TAvTransport = function (location) {
    var module = {
        location: '',
        host: '',
        port: '',
        friendlyName: '',
        controlURL: '',
        cmControlURL: '' //connection manager control url
    };

    module.location = location;

    module.startUp = function (callback) {
        //start up and send request to 'location' then parse response
        //CF.log('>> Starting Up ' + module.location);
        
        //extract host ip and port
        var regExpIP = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;
        var regExpPort = /:\d{1,5}/;
        var regMatchHost = module.location.match(regExpIP);
        var regMatchPort = module.location.match(regExpPort);
        module.host = regMatchHost[0];
        module.port = regMatchPort[0].substr(1);
        
        //request to get Description
        CF.request(module.location, 'GET', {'User-Agent': 'Android/4.2.2 UPnP/1.0 iViewer/4.0.182'}, function (status, response, body) {
            if (status == 200) {
                module._parseDescription(body, callback);
            } else {
                //CF.log(status);
            };
        });
        
    };
    
    module._parseDescription = function(body, callback) {
        //CF.log('>> Parse Description');
        var descObj = simplexml_load_string(body);

        module.friendlyName = descObj.device[0].friendlyName[0].textNode;
        var services = descObj.device[0].serviceList[0].service;
        for (var i = 0, imax = services.length; i < imax; i += 1) {
            
            if (services[i].serviceType[0].textNode == cAVTRANSPORT) {
                //CF.log('AVTransport url:'+services[i].serviceType[0].textNode);
                module.controlURL = services[i].controlURL[0].textNode;
            }
            if (services[i].serviceType[0].textNode == cCONNECTIONMANAGER) {
                //CF.log('ConnectionManager url:' + services[i].serviceType[0].textNode);
                module.cmControlURL = services[i].controlURL[0].textNode;
            }
        }
        if (descObj.device[0].deviceList!=undefined) {
            for (var i = 0, imax = descObj.device[0].deviceList[0].device.length; i < imax; i += 1) {
                var services = descObj.device[0].deviceList[0].device[i].serviceList[0].service;
                for (var j = 0, jmax = services.length; j < jmax; j += 1) {
                    if (services[j].serviceType[0].textNode == cAVTRANSPORT) {
                        //CF.log('AVTransport url:'+services[j].serviceType[0].textNode);
                        module.controlURL = services[j].controlURL[0].textNode;
                    }
                    if (services[j].serviceType[0].textNode == cCONNECTIONMANAGER) {
                        //CF.log('ConnectionManager url:' + services[j].serviceType[0].textNode);
                        module.cmControlURL = services[j].controlURL[0].textNode;
                    }
                }
            }
        }
        ////CF.log(JSON.stringify(module));
        if(callback != undefined) {
            callback();
        }
    };
    
    module.getCurrentConnectionID = function () {
        //CF.log('>> GetProtocolInfo Request');
        var headers = {
            'Content-Type': 'text/xml',
            'User-Agent':  'Android/4.2.2 UPnP/1.0 iViewer/4.0.182',
            'SOAPACTION': '"urn:schemas-upnp-org:service:ConnectionManager:1#GetCurrentConnectionIDs"'
        };
            
        var actionUrl = 'http://' + module.host + ':' + module.port + module.cmControlURL;
        var actionXML = '<?xml version="1.0"?>'
        actionXML += '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">';
        actionXML += '<s:Body><u:GetCurrentConnectionIDs xmlns:u="urn:schemas-upnp-org:service:ConnectionManager:1">';
        actionXML += '</u:GetCurrentConnectionIDs></s:Body></s:Envelope>';
        CF.request(actionUrl, 'POST', headers, actionXML, function (status, response, body) {
            if (status == 200) {
                ////CF.log('cm GetCurrentConnectionIDs response: ' + body);
                module._parseConnectionIDs(body);
            } else {
                //CF.log('cm GetCurrentConnectionIDs err: ' +status + '/' + JSON.stringify(headers) + '/' + body);
            };
        });

    };
    module._parseConnectionIDs = function (body) {
        var descObj = simplexml_load_string(body);
        ////CF.log(JSON.stringify(descObj));    
        var cID = descObj['s:Body']['0']['u:GetCurrentConnectionIDsResponse']['0']['ConnectionIDs']['0'].textNode;
        ////CF.log('ZAZAZZZA: '+ cID);
        module.getConnectionInfo(cID);
    };
    module.getConnectionInfo = function (cID) {
        
        //CF.log('>> GetProtocolInfo Request');
        var headers = {
            'Content-Type': 'text/xml',
            'User-Agent':  'Android/4.2.2 UPnP/1.0 iViewer/4.0.182',
            'SOAPACTION': '"urn:schemas-upnp-org:service:ConnectionManager:1#GetCurrentConnectionInfo"'
        };
        var actionUrl = 'http://' + module.host + ':' + module.port + module.cmControlURL;
        var actionXML = '<?xml version="1.0"?>'
        actionXML += '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">';
        actionXML += '<s:Body><u:GetCurrentConnectionInfo xmlns:u="urn:schemas-upnp-org:service:ConnectionManager:1">';
        actionXML += '<ConnectionID>' + cID + '</ConnectionID>';
        actionXML += '</u:GetCurrentConnectionInfo></s:Body></s:Envelope>';
        CF.request(actionUrl, 'POST', headers, actionXML, function (status, response, body) {
            if (status == 200) {
                ////CF.log('cm GetCurrentConnectionInfo response: ' + body);

            } else {
                //CF.log('cm GetCurrentConnectionInfo err: ' +status + '/' + JSON.stringify(headers) + '/' + body);
            };
        });
    };
    module.sendGetProtocolInfo = function () {
        //CF.log('>> GetProtocolInfo Request');
        var headers = {
            'Content-Type': 'text/xml',
            'User-Agent':  'Android/4.2.2 UPnP/1.0 iViewer/4.0.182',
            'SOAPACTION': '"urn:schemas-upnp-org:service:ConnectionManager:1#GetProtocolInfo"'
        };
        var actionUrl = 'http://' + module.host + ':' + module.port + module.cmControlURL;
        var actionXML = '<?xml version="1.0"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><s:Body><u:GetProtocolInfo xmlns:u="urn:schemas-upnp-org:service:ConnectionManager:1"></u:GetProtocolInfo></s:Body></s:Envelope>';
        CF.request(actionUrl, 'POST', headers, actionXML, function (status, response, body) {
            if (status == 200) {
                ////CF.log('cm GetProtocolInfo response: ' + body);
                module.getCurrentConnectionID();
            } else {
                //CF.log('cm GetProtocolInfo err: ' +status + '/' + JSON.stringify(headers) + '/' + body);
            };
        });

    };
    module.sendSetNextAVTransportURIRequest = function (mediaUrl, meta) {
        //send browse request and return list like JS Object
        //CF.log('>> SetNextAVTransportURI Request');
        var headers = {
            'Content-Type': 'text/xml',
            'User-Agent':  'Android/4.2.2 UPnP/1.0 iViewer/4.0.182',
            'SOAPACTION': '"urn:schemas-upnp-org:service:AVTransport:1#SetNextAVTransportURI"'
        };
        
        var actionXML = soapPRE;
        actionXML += '<u:SetNextAVTransportURI xmlns:u="urn:schemas-upnp-org:service:AVTransport:1">';
        actionXML += '<InstanceID>0</InstanceID>';
        actionXML += '<NextURI>' + mediaUrl + '</NextURI>';
        actionXML += '<NextURIMetaData>' + meta + '</NextURIMetaData>';
        actionXML += '</u:SetNextAVTransportURI>';
        actionXML += soapEND;
        
        var actionUrl = 'http://' + module.host + ':' + module.port + module.controlURL;
        ////CF.log(actionUrl);        
        CF.request(actionUrl, 'POST', headers, actionXML, function (status, response, body) {
            if (status == 200) {
                //
            } else {
                //CF.log(status + '/' + JSON.stringify(headers) + '/' + body);
            };
        });
    };
    module.sendSetAVTransportURIRequest = function (mediaUrl, meta) {
        //send browse request and return list like JS Object
        //CF.log('>> SetAVTransportURI Request');
        var headers = {
            'Content-Type': 'text/xml',
            'User-Agent':  'Android/4.2.2 UPnP/1.0 iViewer/4.0.182',
            'SOAPACTION': '"urn:schemas-upnp-org:service:AVTransport:1#SetAVTransportURI"'
        };
        
        var actionXML = soapPRE;
        actionXML += '<u:SetAVTransportURI xmlns:u="urn:schemas-upnp-org:service:AVTransport:1">';
        actionXML += '<InstanceID>0</InstanceID>';
        actionXML += '<CurrentURI>' + mediaUrl + '</CurrentURI>';
        actionXML += '<CurrentURIMetaData>' + meta + '</CurrentURIMetaData>';
        actionXML += '</u:SetAVTransportURI>';
        actionXML += soapEND;
        
        var actionUrl = 'http://' + module.host + ':' + module.port + module.controlURL;
        ////CF.log(actionUrl);
        CF.log('actionUrl:' + actionUrl);
        CF.log('actionXML:' + actionXML);
        CF.request(actionUrl, 'POST', headers, actionXML, function (status, response, body) {
            CF.log(body);
            if (status == 200) {
                //CF.log('SetAVTransportURI succes');
                CF.log(body);
                var that = module;
                setTimeout( function() { that.sendPlayRequest();}, 800);
            } else {
                //CF.log(status + '/' + JSON.stringify(headers) + '/' + body);
            };
        });
    };
    module.sendPlayRequest = function () {
        //send browse request and return list like JS Object
        //CF.log('>> Play Request');
        var headers = {
            'Content-Type': 'text/xml',
            'User-Agent':  'Android/4.2.2 UPnP/1.0 iViewer/4.0.182',
            'SOAPACTION': '"urn:schemas-upnp-org:service:AVTransport:1#Play"'
        };
        
        var actionXML = soapPRE;
        actionXML += '<u:Play xmlns:u="urn:schemas-upnp-org:service:AVTransport:1">';
        actionXML += '<InstanceID>0</InstanceID>';
        actionXML += '<Speed>1</Speed>';
        actionXML += '</u:Play>';
        actionXML += soapEND;
        
        var actionUrl = 'http://' + module.host + ':' + module.port + module.controlURL;
        ////CF.log(actionUrl);
        ////CF.log(JSON.stringify(headers));
        ////CF.log(actionXML);
        
        CF.request(actionUrl, 'POST', headers, actionXML, function (status, response, body) {
            CF.log(body);
            if (status == 200) {
                ////CF.log('nyaaaa: ' + body);
            } else {
               //CF.log(status + '/' + JSON.stringify(headers) + '/' + body);
            };
        });
    };
    module.sendControlRequest = function (command) {
        //send browse request and return list like JS Object
        //CF.log('>> ' + command + ' Request');
        var headers = {
            'Content-Type': 'text/xml',
            'User-Agent':  'Android/4.2.2 UPnP/1.0 iViewer/4.0.182',
            'SOAPACTION': '"urn:schemas-upnp-org:service:AVTransport:1#'+command + '"'
        };
        
        var actionXML = soapPRE;
        actionXML += '<u:' + command + ' xmlns:u="urn:schemas-upnp-org:service:AVTransport:1">';
        actionXML += '<InstanceID>0</InstanceID>';
        //actionXML += '<Speed>1</Speed>';
        actionXML += '</u:' + command + '>';
        actionXML += soapEND;
        
        var actionUrl = 'http://' + module.host + ':' + module.port + module.controlURL;
        ////CF.log(actionUrl);
        ////CF.log(JSON.stringify(headers));
        ////CF.log(actionXML);
        
        CF.request(actionUrl, 'POST', headers, actionXML, function (status, response, body) {
            if (status == 200) {
                ////CF.log('nyaaaa: ' + body);
            } else {
                //CF.log(status + '/' + JSON.stringify(headers) + '/' + body);
            };
        });
        
    };
    
    return module;
}


var TContentDir = function (location) {
    var module = {
        location: '',
        host: '',
        port: '',
        friendlyName: '',
        controlURL: ''
    };

    module.location = location;

    module.startUp = function (callback) {
        //start up and send request to 'location' then parse response
        //CF.log('>> Starting Up ' + module.location);
        
        //extract host ip and port
        var regExpIP = /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;
        var regExpPort = /:\d{1,5}/;
        var regMatchHost = module.location.match(regExpIP);
        var regMatchPort = module.location.match(regExpPort);
        module.host = regMatchHost[0];
        module.port = regMatchPort[0].substr(1);
        
        //request to get Description
        CF.request(module.location, 'GET', {'User-Agent': 'Android/4.2.2 UPnP/1.0 iViewer/4.0.182'}, function (status, response, body) {
            if (status == 200) {
                ////CF.log('Response from ' + module.location +': ' + body)
                module._parseDescription(body, callback);
            } else {
                //CF.log(status);
            };
        });
        
    };
    
    module._parseDescription = function(body, callback) {
        //CF.log('>> Parse Description');

        var descObj = simplexml_load_string(body);
       // //CF.log('Simple XML object: ' + JSON.stringify(descObj));
        module.friendlyName = descObj.device[0].friendlyName[0].textNode;
        var services = descObj.device[0].serviceList[0].service;
        //CF.log('Start looking services');
        for (var i = 0, imax = services.length; i < imax; i += 1) {
            
            if (services[i].serviceType[0].textNode == cCONTENTDIR) {
                ////CF.log(services[i].serviceType[0].textNode);
                module.controlURL = services[i].controlURL[0].textNode;
            }
        }
        if (descObj.device[0].deviceList!=undefined) {
            for (var i = 0, imax = descObj.device[0].deviceList[0].device.length; i < imax; i += 1) {
                var services = descObj.device[0].deviceList[0].device[i].serviceList[0].service;
                for (var j = 0, jmax = services.length; j < jmax; j += 1) {
                    if (services[j].serviceType[0].textNode == cCONTENTDIR) {
                        ////CF.log(services[j].serviceType[0].textNode);
                        module.controlURL = services[j].controlURL[0].textNode;
                    }
                }
            }
        }
        //CF.log('Generated module object:' + JSON.stringify(module) + '\n\n');
        if (callback != undefined) {
            callback(); 
        }
        //module.sendBrowseRequest('0');
    };
    module.sendBrowseRequest = function (objectID) {
        //send browse request and return list like JS Object
        //CF.log('>> Send Browse Request');
        var headers = {
            'Content-Type': 'text/xml',
            'User-Agent':  'Android/4.2.2 UPnP/1.0 iViewer/4.0.182',
            'SOAPACTION': '"urn:schemas-upnp-org:service:ContentDirectory:1#Browse"'
        };
        
        var actionXML = soapPRE;
        actionXML += '<u:Browse xmlns:u="urn:schemas-upnp-org:service:ContentDirectory:1">';
        actionXML += '<ObjectID>' + objectID + '</ObjectID>';
        actionXML += '<BrowseFlag>BrowseDirectChildren</BrowseFlag>';
        actionXML += '<Filter>*</Filter>';
        actionXML += '<StartingIndex>0</StartingIndex>';
        actionXML += '<RequestedCount>999</RequestedCount>';
        actionXML += '<SortCriteria/>';
        actionXML += '</u:Browse>';
        actionXML += soapEND;
        
        var actionUrl = 'http://' + module.host + ':' + module.port + module.controlURL;
        ////CF.log(actionUrl);
        ////CF.log(JSON.stringify(headers));
        ////CF.log(actionXML);
        
        CF.request(actionUrl, 'POST', headers, actionXML, function (status, response, body) {
            if (status == 200) {
                var tmpObj = simplexml_load_string(body);
                module.currentContent = simplexml_load_string(tmpObj['s:Body'][0]['u:BrowseResponse'][0]['Result'][0]['textNode']);
                ////CF.log(JSON.stringify(module.currentContent));
                contentList.currentModule = module;
                contentList.createList();
            } else {
                //CF.log(status);
                //CF.log(response);
                //CF.log(body);
                //CF.log(actionUrl);
                //CF.log(JSON.stringify(headers));
                //CF.log(actionXML);
            };
        });
    };
    module.sendBrowseMetaRequest = function (objectID, callback, uri) {
        //send browse request and return list like JS Object
        //CF.log('>> Send Browse Meta Request');
        var headers = {
            'Content-Type': 'text/xml',
            'User-Agent':  'Android/4.2.2 UPnP/1.0 iViewer/4.0.182',
            'SOAPACTION': '"urn:schemas-upnp-org:service:ContentDirectory:1#Browse"'
        };
        
        var actionXML = soapPRE;
        actionXML += '<u:Browse xmlns:u="urn:schemas-upnp-org:service:ContentDirectory:1">';
        actionXML += '<ObjectID>' + objectID + '</ObjectID>';
        actionXML += '<BrowseFlag>BrowseMetadata</BrowseFlag>';
        actionXML += '<Filter>*</Filter>';
        actionXML += '<StartingIndex>0</StartingIndex>';
        actionXML += '<RequestedCount>0</RequestedCount>';
        actionXML += '<SortCriteria/>';
        actionXML += '</u:Browse>';
        actionXML += soapEND;
        
        var actionUrl = 'http://' + module.host + ':' + module.port + module.controlURL;
        ////CF.log(actionUrl);
        ////CF.log(JSON.stringify(headers));
        ////CF.log(actionXML);
        //var meta = '';
        CF.request(actionUrl, 'POST', headers, actionXML, function (status, response, body) {
            if (status == 200) {
                var tmpObj = simplexml_load_string(body);
                ////CF.log('tmpObj: ' + JSON.stringify(tmpObj));
                ////CF.log(tmpObj['s:Body'][0]['u:BrowseResponse'][0]['Result'][0]['textNode']);
                var metaData = tmpObj['s:Body'][0]['u:BrowseResponse'][0]['Result'][0]['textNode'];
                
                
                metaData = metaData.encodeHTML();
                ////CF.log('Get metadata: ' + metaData);
                setTimeout( function() {callback(uri, metaData);}, 1000);
            } else {
                //CF.log(status);
                //CF.log(response);
                //CF.log(body);
                //CF.log(actionUrl);
                //CF.log(JSON.stringify(headers));
                //CF.log(actionXML);
            };
        });
    };
    
    return module;
}

var UPnP = {};

var contentList = {
    listJoin: 'l3',
    duneListJoin: 'l300',
    currentModule: {},
    currentAVTransport: {},
    contentHistory: ['0'],
    createList: function() {
        var that = this;
        that.listArr = [];
        CF.listRemove(that.listJoin);
        //CF.listRemove(that.duneListJoin);
        that.listArr.push({s1: '[....]', s2: ''}); //, s5: contentIcon

        if (this.currentModule.currentContent.container != undefined) {
            ////CF.log(JSON.stringify(this.currentModule.currentContent));
            for (var i = 0, imax = this.currentModule.currentContent.container.length; i < imax; i += 1) {
                var contentTitle = this.currentModule.currentContent.container[i]['dc:title'][0].textNode;
                that.listArr.push({s1: contentTitle, s100: 'container', s2: 'folder.png', d100: i});
                
                ////CF.log(JSON.stringify(listArr[i]));
            }
        }
        if (this.currentModule.currentContent.item != undefined) {
            ////CF.log(JSON.stringify(this.currentModule.currentContent));
            for (var i = 0, imax = this.currentModule.currentContent.item.length; i < imax; i += 1) {
                var contentTitle = this.currentModule.currentContent.item[i]['dc:title'][0].textNode;
                var contentIcon = '';
                ////CF.log('Creating list item: ' + i + ': ' + contentTitle + ': ' + JSON.stringify(this.currentModule.currentContent.item[i]));
                if (this.currentModule.currentContent.item[i]['upnp:icon'] != undefined) {
                    contentIcon = this.currentModule.currentContent.item[i]['upnp:icon'][0].textNode;
                } else {
                    if (this.currentModule.currentContent.item[i]['upnp:class'] != undefined) {
                        switch (this.currentModule.currentContent.item[i]['upnp:class'][0].textNode) {
                            case 'object.item.videoItem':
                                contentIcon = 'videoItem.png';
                                break;
                            case 'object.item.audioItem.musicTrack':
                                contentIcon = 'musicTrack.png';
                                break;
                            case 'object.item.imageItem':
                                contentIcon = 'imageItem.png';
                                break;
                            default:
                                break;
                        }
                    }
                }
                //CF.loadAsset(contentIcon, CF.BINARY, null, CF.CACHE);
                that.listArr.push({s1: contentTitle, s2:contentIcon, s100: 'item', d100: i}); //, s5: contentIcon
                ////CF.log(JSON.stringify(listArr[i]));
            }
        }
        CF.listAdd(that.listJoin, that.listArr); 
        //CF.listAdd(that.duneListJoin, that.listArr); 
    },
   /* sendPlaylist: function() {
        //CF.log('Create Playlist');
        if (this.currentModule.currentContent.item != undefined) {
            for(var i = 0, imax = this.currentModule.currentContent.item.length; i < imax; i += 1) {
                var contentRes = this.currentModule.currentContent.item[i]['res'][0].textNode;
                var contentId = this.currentModule.currentContent.item[i]['id'];
                //CF.log(contentRes);
                this.currentModule.sendBrowseMetaRequest(contentId, contentList.currentAVTransport.sendSetNextAVTransportURIRequest, contentRes);
            }
        }
    }, */
    test1: function() {
        var that = this;
        //CF.log(JSON.stringify(this.currentModule.currentContent));
    },
    selectItem: function(list, listIndex, join) {
        var that = this;
        CF.listUpdate(list, [{ index:CF.AllItems, d400:0 }]);
        CF.listUpdate(list, [{ index:listIndex, d400:1}]);
        ////CF.log('selectItem ' + listIndex);
        if (listIndex == 0 ) {
            that.browsePrevious();
        } else {

            if (that.listArr[listIndex].s100 == 'container') {
                var index = that.listArr[listIndex].d100;
                var contentId = this.currentModule.currentContent.container[index]['id'];
                var contentClass = this.currentModule.currentContent.container[index]['upnp:class'][0].textNode;
                ////CF.log(contentId);
                this.contentHistory.push(contentId);
                ////CF.log(contentClass);
                //if (contentClass.substr(cCONTENTDIR)) {
                    this.currentModule.sendBrowseRequest(contentId);
                    this._lastClickList = true;
                //}
            }
            if (that.listArr[listIndex].s100 == 'item') {
                var index = that.listArr[listIndex].d100;
                var contentId = this.currentModule.currentContent.item[index]['id'];
                var contentClass = this.currentModule.currentContent.item[index]['upnp:class'][0].textNode;
                var contentRes = this.currentModule.currentContent.item[index]['res'][0].textNode;
                var contentProtocolInfo = this.currentModule.currentContent.item[index]['res'][0].protocolInfo;
                var dcTitle = this.currentModule.currentContent.item[index]['dc:title'][0].textNode;
                var itemID = this.currentModule.currentContent.item[index].id;
                var itemParentID = this.currentModule.currentContent.item[index].parentID;
                ////CF.log(contentId);
                ////CF.log(contentClass);
                ////CF.log(contentRes);               
                    switch(list) {
                        case that.listJoin:
                            this.currentAVTransport.sendControlRequest('Stop');
                            setTimeout( function() {that.currentModule.sendBrowseMetaRequest(contentId, contentList.currentAVTransport.sendSetAVTransportURIRequest, contentRes);}, 1000);
                            break;
                        case that.duneListJoin:
                            DuneHD.sendCMD('STOP');
                            setTimeout( function() { DuneHD.play(contentRes); }, 1000);
                            break;
                        default:
                            break;
                    }
            }
        }
    },
    browsePrevious: function() {
        
        ////CF.log(this.contentHistory);
        if (this.contentHistory.length > 1) {
            if (this._lastClickList) {
                var contentId = this.contentHistory.pop();
                this._lastClickList = false;
            }
            var contentId = this.contentHistory.pop();
            this.currentModule.sendBrowseRequest(contentId);
        } else {
            this.currentModule.sendBrowseRequest('0');
        }
    }
};

var UPnP_devices = {
    serversListJoin: 'l1',
    renderersListJoin: 'l2',
    broadcastSysName: 'BroadCast',
    contentDirDevices: [],
    avTransportDevices: [],
    updateDevices: function() {
        CF.getJoin("d202", function(join, value, tokens) {
            if(value != 1) {
                CF.setJoin('d202', 1);
                setTimeout(function() {UPnP_devices.searchContentDirectory();}, 1000);
                setTimeout(function() {UPnP_devices.searchAVTransport();}, 15000);
                setTimeout(function() {CF.setJoin('d202', 0);}, 20000);
            }
        });


    },
    updateDevicesForDune: function() {
        CF.getJoin("d202", function(join, value, tokens) {
            if(value != 1) {
                CF.setJoin('d202', 1);
                setTimeout(function() {UPnP_devices.searchContentDirectory();}, 1000);
                setTimeout(function() {CF.setJoin('d202', 0);}, 10000);
            }
        });
        //CF.setJoin('d202', 1);
        
    },
    searchContentDirectory: function() {
        var that = this;
        this.clearContentDir();
        //search content directory service
        var command =   'M-SEARCH * HTTP/1.1\r\n' +
                        'HOST: 239.255.255.250:1900\r\n' + //239.255.255.250:1900
                        'MAN: "ssdp:discover"\r\n' +
                        'ST: urn:schemas-upnp-org:service:ContentDirectory:1\r\n' + //urn:schemas-upnp-org:service:ContentDirectory:1
                        'MX: 5\r\n' +
                        '\r\n';
        CF.unwatch(CF.FeedbackMatchedEvent, that.broadcastSysName, "ANSWER_BCAST");
        setTimeout( function() { 
            CF.watch(CF.FeedbackMatchedEvent, that.broadcastSysName, "ANSWER_BCAST", that.contentDirectoryFeedback);
            CF.send(that.broadcastSysName,   command, CF.BINARY);
        }, 1000) ; 
        //CF.send(that.broadcastSysName,   command, CF.BINARY);
    },
    searchAVTransport: function() {
        //search AV Transport
        var that = this;
        this.clearAVTransport();
        var command =   'M-SEARCH * HTTP/1.1\r\n' +
                        'HOST: 239.255.255.250:1900\r\n' + //239.255.255.250:1900
                        'MAN: "ssdp:discover"\r\n' +
                        'ST: urn:schemas-upnp-org:device:MediaRenderer:1\r\n' + //urn:schemas-upnp-org:service:ContentDirectory:1
                        'MX: 5\r\n' +
                        '\r\n';
        CF.unwatch(CF.FeedbackMatchedEvent, that.broadcastSysName, "ANSWER_BCAST");
        setTimeout( function() { 
            CF.watch(CF.FeedbackMatchedEvent, that.broadcastSysName, "ANSWER_BCAST", that.avTransportFeedback);
            CF.send(that.broadcastSysName,   command, CF.BINARY);
        }, 1000) ;
        
    },
    clearContentDir: function() {
        var that = this;
        this.contentDirDevices = [];
        CF.listRemove(that.serversListJoin);
    },
    clearAVTransport: function() {
        var that = this;
        this.avTransportDevices = [];
        CF.listRemove(that.renderersListJoin);
    },
    contentDirectoryFeedback: function(feedbackItem, matchedString) {
        var that = UPnP_devices; //i should ask
        var tmpArr = matchedString.split('\r\n');
        ////CF.log(tmpArr);
        for (var i = 0, imax = tmpArr.length; i < imax; i += 1) {
            var re = /location/i;
            if( tmpArr[i].toLowerCase().indexOf('location')>=0 ) {
                var tmpStr = tmpArr[i];
            }
        }
        ////CF.log(tmpStr);
        tmpStr = tmpStr.substr(tmpStr.indexOf('http'));
        ////CF.log(tmpStr);
        var tmpModule = TContentDir(tmpStr);
        tmpModule.startUp(that.createContentDirList);
        if (that.contentDirDevices != undefined) {
            that.contentDirDevices.push(tmpModule);
        } else {
            that.contentDirDevices = [];
            that.contentDirDevices.push(tmpModule);
        }
        //that.createContentDirList();
        //that.contentDirDevices[ that.contentDirDevices.length - 1].startUp();
    },
    avTransportFeedback: function(feedbackItem, matchedString) {
        var that = UPnP_devices; //i should ask
        var tmpArr = matchedString.split('\r\n');
        ////CF.log(tmpArr);
        for (var i = 0, imax = tmpArr.length; i < imax; i += 1) {
            var re = /location/i;
            if( tmpArr[i].toLowerCase().indexOf('location')>=0 ) {
                var tmpStr = tmpArr[i];
            }
        }
        ////CF.log(tmpStr);
        tmpStr = tmpStr.substr(tmpStr.indexOf('http'));
        ////CF.log(tmpStr);
        var tmpModule = TAvTransport(tmpStr);
        tmpModule.startUp(that.createAVTransportList);
        if (that.avTransportDevices != undefined) {
            that.avTransportDevices.push(tmpModule);
        } else {
            that.avTransportDevices = [];
            that.avTransportDevices.push(tmpModule);
        }
        //that.createAVTransportList();
    },
    createContentDirList: function() {
        var that = UPnP_devices;
        CF.listRemove(that.serversListJoin);
        var tmpArr = [];
        for(var i = 0, imax = that.contentDirDevices.length; i< imax; i += 1) {
            tmpArr.push({s1: that.contentDirDevices[i].friendlyName});
        }
        CF.listAdd(that.serversListJoin, tmpArr);
    },
    createAVTransportList: function() {
        var that = UPnP_devices;
        CF.listRemove(that.renderersListJoin);
        var tmpArr = [];
        for(var i = 0, imax = that.avTransportDevices.length; i< imax; i += 1) {
            tmpArr.push({s1: that.avTransportDevices[i].friendlyName});
        }
        CF.listAdd(that.renderersListJoin, tmpArr);
    },
    selectAVTransport: function(list, listIndex, join) {
        //select av Transport in list
        CF.listUpdate(list, [{ index:CF.AllItems, d400:0 }]);
        CF.listUpdate(list, [{ index:listIndex, d400:1}]);
        //CF.log('select av Transport device');
        var that = UPnP_devices;
        contentList.currentAVTransport = that.avTransportDevices[listIndex];
        contentList.currentAVTransport.sendGetProtocolInfo();
        CF.setJoin('d2', 0);
    },
    selectContentDir: function(list, listIndex, join) {
        CF.listUpdate(list, [{ index:CF.AllItems, d400:0 }]);
        CF.listUpdate(list, [{ index:listIndex, d400:1}]);
        var that = UPnP_devices;
        //select content dir device in list
        //CF.log('select content dir device');
        contentList.currentModule = that.contentDirDevices[listIndex];
        contentList.contentHistory = [];
        that.contentDirDevices[listIndex].sendBrowseRequest('0');
        CF.setJoin('d1', 0);
    },
    
};
