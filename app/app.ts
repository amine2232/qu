import { Application } from '@nativescript/core';
import { android as androidApp } from '@nativescript/core/application';

if (androidApp) {
    androidApp.on(androidApp.activityRequestPermissionsEvent, (args: any) => {
        console.log('Received permission result');
    });
}

Application.run({ moduleName: 'app-root' });