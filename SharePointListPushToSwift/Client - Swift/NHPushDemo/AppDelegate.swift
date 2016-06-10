//
//  AppDelegate.swift
//  NHPushDemo
//
//  Created by Mimi Xu on 1/26/16.
//  Copyright © 2016 msft. All rights reserved.
//

import UIKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    var newDeviceToken: NSData?


    func application(application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [NSObject : AnyObject]?) -> Bool {
            application.registerUserNotificationSettings(
                UIUserNotificationSettings(forTypes: [.Alert, .Badge, .Sound],
                    categories: nil))
            application.registerForRemoteNotifications()
            return true
    }
    
    func application(application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: NSData) {
            NSLog("didRegister")
            
            //GOT DEVICE TOKEN
            newDeviceToken = deviceToken
            NSLog("Yay device token obtained")
            
            
    }
    
    func application(application: UIApplication,
    didFailToRegisterForRemoteNotificationsWithError error: NSError) {
        NSLog("Failed to register for remote notifications: \n%@", error.description)
    }
    
    // received notification
    func application(application: UIApplication,
        didReceiveRemoteNotification userInfo: [NSObject : AnyObject]) {
            
            NSLog("%@", userInfo)
            
            let apsNotification = userInfo["aps"] as! NSDictionary
            let apsString       = apsNotification["alert"] as! String
            
            let alert = UIAlertController(title: "Alert", message:apsString, preferredStyle: .Alert)
            let okAction = UIAlertAction(title: "OK", style: .Default) { _ in
                NSLog("OK")
            }
            let cancelAction = UIAlertAction(title: "Cancel", style: .Default) { _ in
                NSLog("Cancel")
            }
            
            alert.addAction(okAction)
            alert.addAction(cancelAction)
            
            var currentViewController = UIApplication.sharedApplication().delegate?.window??.rootViewController
            while currentViewController?.presentedViewController != nil {
                currentViewController = currentViewController?.presentedViewController
            }
            
            currentViewController?.presentViewController(alert, animated: true){}
            
    }

}

