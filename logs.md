-------------------------------------
Translated Report (Full Report Below)
-------------------------------------
Process:             Divi [1355]
Path:                /private/var/containers/Bundle/Application/96B4F5A7-F2E6-47D6-94F0-5AF8EEF4914C/Divi.app/Divi
Identifier:          com.sohi.divi
Version:             1.0.0 (33)
AppStoreTools:       17E187
AppVariant:          1:iPhone18,2:26
Beta:                YES
Code Type:           ARM-64 (Native)
Role:                Foreground
Parent Process:      launchd [1]
Coalition:           com.sohi.divi [757]
User ID:             501

Date/Time:           2026-04-27 23:46:57.4393 -0400
Launch Time:         2026-04-27 23:46:57.1138 -0400
Hardware Model:      iPhone18,2
OS Version:          iPhone OS 26.3.1 (23D8133)
Release Type:        User
Baseband Version:    1.40.03

Beta Identifier:     5F9ACA34-DFD5-4B35-8E6B-346C359422DC
Incident Identifier: 10407B7B-54F1-494C-8D57-11F87A472AA4

Time Awake Since Boot: 4500 seconds

Triggered by Thread: 3, Dispatch Queue: com.meta.react.turbomodulemanager.queue

Exception Type:    EXC_CRASH (SIGABRT)
Exception Codes:   0x0000000000000000, 0x0000000000000000

Termination Reason:  Namespace SIGNAL, Code 6, Abort trap: 6
Terminating Process: Divi [1355]


Application Specific Information:
abort() called


Thread 0 name:   Dispatch queue: com.apple.main-thread
Thread 0:
0   libsystem_kernel.dylib        	       0x250bcecd4 mach_msg2_trap + 8
1   libsystem_kernel.dylib        	       0x250bd22f8 mach_msg2_internal + 76
2   libsystem_kernel.dylib        	       0x250bd2214 mach_msg_overwrite + 428
3   libsystem_kernel.dylib        	       0x250bd205c mach_msg + 24
4   CoreFoundation                	       0x1a307d868 __CFRunLoopServiceMachPort + 160
5   CoreFoundation                	       0x1a3054848 __CFRunLoopRun + 1188
6   CoreFoundation                	       0x1a3053a6c _CFRunLoopRunSpecificWithOptions + 532
7   GraphicsServices              	       0x2479f1498 GSEventRunModal + 120
8   UIKitCore                     	       0x1a8b03df8 -[UIApplication _run] + 792
9   UIKitCore                     	       0x1a8aace54 UIApplicationMain + 336
10  Divi                          	       0x10426d620 0x104268000 + 22048
11  dyld                          	       0x1a002ee28 start + 7116

Thread 1:

Thread 2 name:   Dispatch queue: AXBinaryMonitorQueue
Thread 2:
0   libsystem_kernel.dylib        	       0x250bd4600 lstat + 8
1   Foundation                    	       0x1a06807cc _NSResolveSymlinksInPathUsingCache + 668
2   Foundation                    	       0x1a0fe9d74 -[NSString(NSPathUtilities) _stringByResolvingSymlinksInPathUsingCache:] + 128
3   Foundation                    	       0x1a0705130 _NSFrameworkPathFromLibraryPath + 52
4   Foundation                    	       0x1a0f4dc40 __25+[NSBundle allFrameworks]_block_invoke + 228
5   libdispatch.dylib             	       0x1dbd7a7fc _dispatch_client_callout + 16
6   libdispatch.dylib             	       0x1dbd639e0 _dispatch_once_callout + 32
7   Foundation                    	       0x1a0f4db58 +[NSBundle allFrameworks] + 84
8   AXCoreUtilities               	       0x1b163a7d4 __43-[AXBinaryMonitor evaluateExistingBinaries]_block_invoke + 96
9   libdispatch.dylib             	       0x1dbd60adc _dispatch_call_block_and_release + 32
10  libdispatch.dylib             	       0x1dbd7a7fc _dispatch_client_callout + 16
11  libdispatch.dylib             	       0x1dbd69468 _dispatch_lane_serial_drain + 740
12  libdispatch.dylib             	       0x1dbd69f78 _dispatch_lane_invoke + 440
13  libdispatch.dylib             	       0x1dbd743ec _dispatch_root_queue_drain_deferred_wlh + 292
14  libdispatch.dylib             	       0x1dbd73ce4 _dispatch_workloop_worker_thread + 692
15  libsystem_pthread.dylib       	       0x1ffbad3b8 _pthread_wqthread + 292
16  libsystem_pthread.dylib       	       0x1ffbac8c0 start_wqthread + 8

Thread 3 name:   Dispatch queue: com.meta.react.turbomodulemanager.queue
Thread 3 Crashed:
0   libsystem_kernel.dylib        	       0x250bd90cc __pthread_kill + 8
1   libsystem_pthread.dylib       	       0x1ffbb3810 pthread_kill + 268
2   libsystem_c.dylib             	       0x1ae9d8f64 abort + 124
3   libc++abi.dylib               	       0x1a00dc808 __abort_message + 132
4   libc++abi.dylib               	       0x1a00cb46c demangling_terminate_handler() + 280
5   libobjc.A.dylib               	       0x19ffdbf88 _objc_terminate() + 172
6   libc++abi.dylib               	       0x1a00dbbdc std::__terminate(void (*)()) + 16
7   libc++abi.dylib               	       0x1a00df5c8 __cxa_rethrow + 188
8   libobjc.A.dylib               	       0x19ffe8558 objc_exception_rethrow + 44
9   React                         	       0x105af7548 invocation function for block in facebook::react::ObjCTurboModule::performVoidMethodInvocation(facebook::jsi::Runtime&, char const*, NSInvocation*, NSMutableArray*) + 192
10  React                         	       0x105afc4d4 std::__1::__function::__func<facebook::react::ObjCTurboModule::performVoidMethodInvocation(facebook::jsi::Runtime&, char const*, NSInvocation*, NSMutableArray*)::$_1, std::__1::allocator<facebook::react::ObjCTurboModule::performVoidMethodInvocation(facebook::jsi::Runtime&, char const*, NSInvocation*, NSMutableArray*)::$_1>, void ()>::operator()() + 88
11  libdispatch.dylib             	       0x1dbd60adc _dispatch_call_block_and_release + 32
12  libdispatch.dylib             	       0x1dbd7a7fc _dispatch_client_callout + 16
13  libdispatch.dylib             	       0x1dbd69468 _dispatch_lane_serial_drain + 740
14  libdispatch.dylib             	       0x1dbd69f44 _dispatch_lane_invoke + 388
15  libdispatch.dylib             	       0x1dbd743ec _dispatch_root_queue_drain_deferred_wlh + 292
16  libdispatch.dylib             	       0x1dbd73ce4 _dispatch_workloop_worker_thread + 692
17  libsystem_pthread.dylib       	       0x1ffbad3b8 _pthread_wqthread + 292
18  libsystem_pthread.dylib       	       0x1ffbac8c0 start_wqthread + 8

Thread 4:

Thread 5:

Thread 6:

Thread 7 name:  com.apple.uikit.eventfetch-thread
Thread 7:
0   libsystem_kernel.dylib        	       0x250bcecd4 mach_msg2_trap + 8
1   libsystem_kernel.dylib        	       0x250bd22f8 mach_msg2_internal + 76
2   libsystem_kernel.dylib        	       0x250bd2214 mach_msg_overwrite + 428
3   libsystem_kernel.dylib        	       0x250bd205c mach_msg + 24
4   CoreFoundation                	       0x1a307d868 __CFRunLoopServiceMachPort + 160
5   CoreFoundation                	       0x1a3054848 __CFRunLoopRun + 1188
6   CoreFoundation                	       0x1a3053a6c _CFRunLoopRunSpecificWithOptions + 532
7   Foundation                    	       0x1a1013f54 -[NSRunLoop(NSRunLoop) runMode:beforeDate:] + 212
8   Foundation                    	       0x1a101412c -[NSRunLoop(NSRunLoop) runUntilDate:] + 64
9   UIKitCore                     	       0x1a8ad9094 -[UIEventFetcher threadMain] + 408
10  Foundation                    	       0x1a06d321c __NSThread__start__ + 732
11  libsystem_pthread.dylib       	       0x1ffbb044c _pthread_start + 136
12  libsystem_pthread.dylib       	       0x1ffbac8cc thread_start + 8

Thread 8:

Thread 9:

Thread 10 name:  com.facebook.react.runtime.JavaScript
Thread 10:
0   libsystem_kernel.dylib        	       0x250bcecd4 mach_msg2_trap + 8
1   libsystem_kernel.dylib        	       0x250bd22f8 mach_msg2_internal + 76
2   libsystem_kernel.dylib        	       0x250bd2214 mach_msg_overwrite + 428
3   libsystem_kernel.dylib        	       0x250bd205c mach_msg + 24
4   CoreFoundation                	       0x1a307d868 __CFRunLoopServiceMachPort + 160
5   CoreFoundation                	       0x1a3054848 __CFRunLoopRun + 1188
6   CoreFoundation                	       0x1a3053a6c _CFRunLoopRunSpecificWithOptions + 532
7   React                         	       0x105a8cea0 +[RCTJSThreadManager runRunLoop] + 252
8   Foundation                    	       0x1a06d321c __NSThread__start__ + 732
9   libsystem_pthread.dylib       	       0x1ffbb044c _pthread_start + 136
10  libsystem_pthread.dylib       	       0x1ffbac8cc thread_start + 8

Thread 11 name:  hades
Thread 11:
0   libsystem_kernel.dylib        	       0x250bd45d4 __psynch_cvwait + 8
1   libsystem_pthread.dylib       	       0x1ffbaeb58 _pthread_cond_wait + 984
2   libc++.1.dylib                	       0x1b23bb704 std::__1::condition_variable::wait(std::__1::unique_lock<std::__1::mutex>&) + 32
3   hermes                        	       0x1063cb9c4 hermes::vm::HadesGC::Executor::worker() + 116
4   hermes                        	       0x1063cb92c void* std::__1::__thread_proxy[abi:nn180100]<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct>>, hermes::vm::HadesGC::Executor::Executor()::'lambda'()>>(void*) + 44
5   libsystem_pthread.dylib       	       0x1ffbb044c _pthread_start + 136
6   libsystem_pthread.dylib       	       0x1ffbac8cc thread_start + 8

Thread 12 name:  AudioSession - RootQueue
Thread 12:
0   libsystem_kernel.dylib        	       0x250bcec68 semaphore_timedwait_trap + 8
1   libdispatch.dylib             	       0x1dbd956cc _dispatch_sema4_timedwait + 64
2   libdispatch.dylib             	       0x1dbd62e88 _dispatch_semaphore_wait_slow + 76
3   libdispatch.dylib             	       0x1dbd72d40 _dispatch_worker_thread + 324
4   libsystem_pthread.dylib       	       0x1ffbb044c _pthread_start + 136
5   libsystem_pthread.dylib       	       0x1ffbac8cc thread_start + 8

Thread 13 name:  hades
Thread 13:
0   libsystem_kernel.dylib        	       0x250bd45d4 __psynch_cvwait + 8
1   libsystem_pthread.dylib       	       0x1ffbaeb58 _pthread_cond_wait + 984
2   libc++.1.dylib                	       0x1b23bb704 std::__1::condition_variable::wait(std::__1::unique_lock<std::__1::mutex>&) + 32
3   hermes                        	       0x1063cb9c4 hermes::vm::HadesGC::Executor::worker() + 116
4   hermes                        	       0x1063cb92c void* std::__1::__thread_proxy[abi:nn180100]<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct>>, hermes::vm::HadesGC::Executor::Executor()::'lambda'()>>(void*) + 44
5   libsystem_pthread.dylib       	       0x1ffbb044c _pthread_start + 136
6   libsystem_pthread.dylib       	       0x1ffbac8cc thread_start + 8


Thread 3 crashed with ARM Thread State (64-bit):
    x0: 0x0000000000000000   x1: 0x0000000000000000   x2: 0x0000000000000000   x3: 0x0000000000000000
    x4: 0x0000000000114fba   x5: 0x000000000000001a   x6: 0xffffffffbfc007ff   x7: 0xfffff0003ffff800
    x8: 0xdf684b85e47a6e0b   x9: 0xdf684b848fa91e0b  x10: 0x0000000000000002  x11: 0x0000010000000000
   x12: 0x00000000fffffffd  x13: 0x0000000000000000  x14: 0x0000000000000000  x15: 0x0000000000000000
   x16: 0x0000000000000148  x17: 0x000000016bd37000  x18: 0x0000000000000000  x19: 0x0000000000000006
   x20: 0x0000000000001303  x21: 0x000000016bd370e0  x22: 0x434c4e47432b2b00  x23: 0x00000001506d6600
   x24: 0x0000000150e39410  x25: 0x0000000000000000  x26: 0x0000000000000000  x27: 0x0000000000000000
   x28: 0x0000000000000114   fp: 0x000000016bd366b0   lr: 0x00000001ffbb3810
    sp: 0x000000016bd36690   pc: 0x0000000250bd90cc cpsr: 0x40000000
   far: 0x0000000000000000  esr: 0x56000080 (Syscall)

Binary Images:
       0x104268000 -        0x104857fff Divi arm64  <587ce0b408eb397aaebbaf4ad5841a25> /var/containers/Bundle/Application/96B4F5A7-F2E6-47D6-94F0-5AF8EEF4914C/Divi.app/Divi
       0x1057ec000 -        0x105c27fff React arm64  <d636736195903fe5bbab2a3ad49a83e8> /private/var/containers/Bundle/Application/96B4F5A7-F2E6-47D6-94F0-5AF8EEF4914C/Divi.app/Frameworks/React.framework/React
       0x104e20000 -        0x104ea7fff ReactNativeDependencies arm64  <b35f1182b82e33728a74a4fe502c0906> /private/var/containers/Bundle/Application/96B4F5A7-F2E6-47D6-94F0-5AF8EEF4914C/Divi.app/Frameworks/ReactNativeDependencies.framework/ReactNativeDependencies
       0x1062fc000 -        0x1064fffff hermes arm64  <ba3c949a77073472b346d3e0690c88d0> /private/var/containers/Bundle/Application/96B4F5A7-F2E6-47D6-94F0-5AF8EEF4914C/Divi.app/Frameworks/hermes.framework/hermes
       0x104a80000 -        0x104a8bfff libobjc-trampolines.dylib arm64e  <1954b963897d321f88be880ecef5b408> /private/preboot/Cryptexes/OS/usr/lib/libobjc-trampolines.dylib
       0x104ae4000 -        0x104af7fff GAXClient arm64e  <95fa94bd585e3d41a48310d722bc5efe> /System/Library/AccessibilityBundles/GAXClient.bundle/GAXClient
       0x250bce000 -        0x250c08d2b libsystem_kernel.dylib arm64e  <8d8301292cbe32a9b61ece493eecb399> /usr/lib/system/libsystem_kernel.dylib
       0x1a3037000 -        0x1a35bd73f CoreFoundation arm64e  <2f32d38446373018843e4fc875b865c4> /System/Library/Frameworks/CoreFoundation.framework/CoreFoundation
       0x2479f0000 -        0x2479f87ff GraphicsServices arm64e  <12a401ff966436029f17f3047446e62b> /System/Library/PrivateFrameworks/GraphicsServices.framework/GraphicsServices
       0x1a8a66000 -        0x1aaec59bf UIKitCore arm64e  <c768f963a0cc3f5ca1d32e06d53a2381> /System/Library/PrivateFrameworks/UIKitCore.framework/UIKitCore
       0x1a002a000 -        0x1a00c934b dyld arm64e  <8acdb5808ab738c0a586e667adb1c11c> /usr/lib/dyld
               0x0 - 0xffffffffffffffff ??? unknown-arch  <00000000000000000000000000000000> ???
       0x1ffedf000 -        0x200001c3f CloudSubscriptionFeatures arm64e  <cb06e30fe0303d7db67d6c067a7bd715> /System/Library/PrivateFrameworks/CloudSubscriptionFeatures.framework/CloudSubscriptionFeatures
       0x1a0671000 -        0x1a14b7c9f Foundation arm64e  <42c593bb89fb3ec48220c746811e7a43> /System/Library/Frameworks/Foundation.framework/Foundation
       0x1dbd5f000 -        0x1dbda521f libdispatch.dylib arm64e  <904d48a3d99e3962bfa9c3dfb66bba83> /usr/lib/system/libdispatch.dylib
       0x1b1616000 -        0x1b171ae7f AXCoreUtilities arm64e  <1ad538477b483e4abf494e5c8b366351> /System/Library/PrivateFrameworks/AXCoreUtilities.framework/AXCoreUtilities
       0x1ffbac000 -        0x1ffbb845f libsystem_pthread.dylib arm64e  <4f94107b94d23e888542f5403c581b50> /usr/lib/system/libsystem_pthread.dylib
       0x1ae961000 -        0x1ae9e15af libsystem_c.dylib arm64e  <61a33aa9d6683b35a859b6925c4047b9> /usr/lib/system/libsystem_c.dylib
       0x1a00ca000 -        0x1a00e46c7 libc++abi.dylib arm64e  <754a4876c71936869d9f2bd3aa38cd9c> /usr/lib/libc++abi.dylib
       0x19ffa8000 -        0x19fff9b5f libobjc.A.dylib arm64e  <4358daf977583542a1e19f185534a911> /usr/lib/libobjc.A.dylib
       0x1b2399000 -        0x1b242be23 libc++.1.dylib arm64e  <1ba945bc7f65386a8a4cf74caab2a260> /usr/lib/libc++.1.dylib

VM Region Summary:
ReadOnly portion of Libraries: Total=1.7G resident=0K(0%) swapped_out_or_unallocated=1.7G(100%)
Writable regions: Total=121.8M written=481K(0%) resident=481K(0%) swapped_out=0K(0%) unallocated=121.4M(100%)

                                VIRTUAL   REGION 
REGION TYPE                        SIZE    COUNT (non-coalesced) 
===========                     =======  ======= 
.note.gnu.proper                    320        1 
Activity Tracing                   256K        1 
Audio                               64K        1 
CoreAnimation                       48K        3 
Foundation                          16K        1 
Kernel Alloc Once                   32K        1 
MALLOC                            90.9M       15 
MALLOC guard page                 3424K        4 
STACK GUARD                        224K       14 
Stack                             8080K       14 
VM_ALLOCATE                       22.1M       18 
__AUTH                            7851K      699 
__AUTH_CONST                     101.2M     1086 
__CTF                               824        1 
__DATA                            46.5M     1038 
__DATA_CONST                      34.0M     1095 
__DATA_DIRTY                      9618K      957 
__FONT_DATA                        2352        1 
__INFO_FILTER                         8        1 
__LINKEDIT                       186.6M        7 
__OBJC_RO                         84.3M        1 
__OBJC_RW                         3179K        1 
__TEXT                             1.5G     1116 
__TPRO_CONST                       128K        2 
mapped file                       39.1M        6 
page table in kernel               481K        1 
shared memory                       80K        4 
===========                     =======  ======= 
TOTAL                              2.1G     6089 


-----------
Full Report
-----------

{"roots_installed":0,"app_cohort":"2|date=1777347000000&sf=143441&tid=e335e0dd68400d70939cad54b9e18bad9ea0c729978e9d82009d978466f44cff&ttype=i","app_name":"Divi","app_version":"1.0.0","timestamp":"2026-04-27 23:46:57.00 -0400","slice_uuid":"587ce0b4-08eb-397a-aebb-af4ad5841a25","adam_id":"6762031093","build_version":"33","platform":2,"bundleID":"com.sohi.divi","share_with_app_devs":0,"is_first_party":0,"bug_type":"309","os_version":"iPhone OS 26.3.1 (23D8133)","incident_id":"10407B7B-54F1-494C-8D57-11F87A472AA4","name":"Divi","is_beta":1}
{
  "uptime" : 4500,
  "procRole" : "Foreground",
  "version" : 2,
  "userID" : 501,
  "deployVersion" : 210,
  "modelCode" : "iPhone18,2",
  "coalitionID" : 757,
  "osVersion" : {
    "isEmbedded" : true,
    "train" : "iPhone OS 26.3.1",
    "releaseType" : "User",
    "build" : "23D8133"
  },
  "captureTime" : "2026-04-27 23:46:57.4393 -0400",
  "codeSigningMonitor" : 2,
  "incident" : "10407B7B-54F1-494C-8D57-11F87A472AA4",
  "pid" : 1355,
  "translated" : false,
  "cpuType" : "ARM-64",
  "procLaunch" : "2026-04-27 23:46:57.1138 -0400",
  "procStartAbsTime" : 108741167573,
  "procExitAbsTime" : 108748929506,
  "procName" : "Divi",
  "procPath" : "\/private\/var\/containers\/Bundle\/Application\/96B4F5A7-F2E6-47D6-94F0-5AF8EEF4914C\/Divi.app\/Divi",
  "bundleInfo" : {"CFBundleShortVersionString":"1.0.0","CFBundleVersion":"33","CFBundleIdentifier":"com.sohi.divi","DTAppStoreToolsBuild":"17E187"},
  "storeInfo" : {"itemID":"6762031093","storeCohortMetadata":"2|date=1777347000000&sf=143441&tid=e335e0dd68400d70939cad54b9e18bad9ea0c729978e9d82009d978466f44cff&ttype=i","entitledBeta":true,"deviceIdentifierForVendor":"5F9ACA34-DFD5-4B35-8E6B-346C359422DC","distributorID":"com.apple.TestFlight","softwareVersionExternalIdentifier":"209542989","applicationVariant":"1:iPhone18,2:26","thirdParty":true},
  "parentProc" : "launchd",
  "parentPid" : 1,
  "coalitionName" : "com.sohi.divi",
  "isBeta" : 1,
  "lowPowerMode" : 1,
  "appleIntelligenceStatus" : {"state":"available"},
  "developerMode" : 1,
  "bootProgressRegister" : "0x2000000c",
  "wasUnlockedSinceBoot" : 1,
  "isLocked" : 0,
  "codeSigningID" : "com.sohi.divi",
  "codeSigningTeamID" : "7KK4AZ4AUY",
  "codeSigningFlags" : 570434305,
  "codeSigningValidationCategory" : 2,
  "codeSigningTrustLevel" : 4,
  "codeSigningAuxiliaryInfo" : 9007199254740992,
  "instructionByteStream" : {"beforePC":"fyMD1f17v6n9AwCRD+7\/l78DAJH9e8Go\/w9f1sADX9YQKYDSARAA1A==","atPC":"AwEAVH8jA9X9e7+p\/QMAkQTu\/5e\/AwCR\/XvBqP8PX9bAA1\/WECeA0g=="},
  "bootSessionUUID" : "C6690D6E-A359-40C3-BF9C-47A3101DBC9D",
  "basebandVersion" : "1.40.03",
  "exception" : {"codes":"0x0000000000000000, 0x0000000000000000","rawCodes":[0,0],"type":"EXC_CRASH","signal":"SIGABRT"},
  "termination" : {"flags":0,"code":6,"namespace":"SIGNAL","indicator":"Abort trap: 6","byProc":"Divi","byPid":1355},
  "asi" : {"libsystem_c.dylib":["abort() called"]},
  "faultingThread" : 3,
  "threads" : [{"id":106810,"threadState":{"x":[{"value":268451845},{"value":21592279046},{"value":8589934592},{"value":35197256990720},{"value":0},{"value":35197256990720},{"value":2},{"value":4294967295},{"value":0},{"value":0},{"value":2},{"value":0},{"value":0},{"value":8195},{"value":0},{"value":0},{"value":18446744073709551569},{"value":2},{"value":0},{"value":4294967295},{"value":2},{"value":35197256990720},{"value":0},{"value":35197256990720},{"value":6102279080},{"value":8589934592},{"value":21592279046},{"value":18446744073709550527},{"value":11268505600,"symbolLocation":0,"symbol":"_libkernel_string_functions"}],"flavor":"ARM_THREAD_STATE64","lr":{"value":9944507128},"cpsr":{"value":0},"fp":{"value":6102278928},"sp":{"value":6102278848},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":9944493268},"far":{"value":0}},"queue":"com.apple.main-thread","frames":[{"imageOffset":3284,"symbol":"mach_msg2_trap","symbolLocation":8,"imageIndex":6},{"imageOffset":17144,"symbol":"mach_msg2_internal","symbolLocation":76,"imageIndex":6},{"imageOffset":16916,"symbol":"mach_msg_overwrite","symbolLocation":428,"imageIndex":6},{"imageOffset":16476,"symbol":"mach_msg","symbolLocation":24,"imageIndex":6},{"imageOffset":288872,"symbol":"__CFRunLoopServiceMachPort","symbolLocation":160,"imageIndex":7},{"imageOffset":120904,"symbol":"__CFRunLoopRun","symbolLocation":1188,"imageIndex":7},{"imageOffset":117356,"symbol":"_CFRunLoopRunSpecificWithOptions","symbolLocation":532,"imageIndex":7},{"imageOffset":5272,"symbol":"GSEventRunModal","symbolLocation":120,"imageIndex":8},{"imageOffset":646648,"symbol":"-[UIApplication _run]","symbolLocation":792,"imageIndex":9},{"imageOffset":290388,"symbol":"UIApplicationMain","symbolLocation":336,"imageIndex":9},{"imageOffset":22048,"imageIndex":0},{"imageOffset":20008,"symbol":"start","symbolLocation":7116,"imageIndex":10}]},{"id":106842,"frames":[],"threadState":{"x":[{"value":6102839296},{"value":3075},{"value":6102302720},{"value":0},{"value":409604},{"value":18446744073709551615},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0}],"flavor":"ARM_THREAD_STATE64","lr":{"value":0},"cpsr":{"value":0},"fp":{"value":0},"sp":{"value":6102839296},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":8585398456},"far":{"value":0}}},{"id":106843,"threadState":{"x":[{"value":0},{"value":0},{"value":6155},{"value":6103403342},{"value":18446744073709550480},{"value":16},{"value":0},{"value":3968},{"value":6103412960},{"value":10500627577551781918},{"value":40},{"value":6103404480},{"value":1653760819},{"value":119},{"value":65533},{"value":10},{"value":340},{"value":8825131368},{"value":0},{"value":15},{"value":47},{"value":1},{"value":47},{"value":6103404685},{"value":0},{"value":6103404671},{"value":6103404591},{"value":18446744067606146978},{"value":12206809276}],"flavor":"ARM_THREAD_STATE64","lr":{"value":6986139596},"cpsr":{"value":1073741824},"fp":{"value":6103406944},"sp":{"value":6103404576},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":9944516096},"far":{"value":0}},"queue":"AXBinaryMonitorQueue","frames":[{"imageOffset":26112,"symbol":"lstat","symbolLocation":8,"imageIndex":6},{"imageOffset":63436,"symbol":"_NSResolveSymlinksInPathUsingCache","symbolLocation":668,"imageIndex":13},{"imageOffset":9932148,"symbol":"-[NSString(NSPathUtilities) _stringByResolvingSymlinksInPathUsingCache:]","symbolLocation":128,"imageIndex":13},{"imageOffset":606512,"symbol":"_NSFrameworkPathFromLibraryPath","symbolLocation":52,"imageIndex":13},{"imageOffset":9292864,"symbol":"__25+[NSBundle allFrameworks]_block_invoke","symbolLocation":228,"imageIndex":13},{"imageOffset":112636,"symbol":"_dispatch_client_callout","symbolLocation":16,"imageIndex":14},{"imageOffset":18912,"symbol":"_dispatch_once_callout","symbolLocation":32,"imageIndex":14},{"imageOffset":9292632,"symbol":"+[NSBundle allFrameworks]","symbolLocation":84,"imageIndex":13},{"imageOffset":149460,"symbol":"__43-[AXBinaryMonitor evaluateExistingBinaries]_block_invoke","symbolLocation":96,"imageIndex":15},{"imageOffset":6876,"symbol":"_dispatch_call_block_and_release","symbolLocation":32,"imageIndex":14},{"imageOffset":112636,"symbol":"_dispatch_client_callout","symbolLocation":16,"imageIndex":14},{"imageOffset":42088,"symbol":"_dispatch_lane_serial_drain","symbolLocation":740,"imageIndex":14},{"imageOffset":44920,"symbol":"_dispatch_lane_invoke","symbolLocation":440,"imageIndex":14},{"imageOffset":87020,"symbol":"_dispatch_root_queue_drain_deferred_wlh","symbolLocation":292,"imageIndex":14},{"imageOffset":85220,"symbol":"_dispatch_workloop_worker_thread","symbolLocation":692,"imageIndex":14},{"imageOffset":5048,"symbol":"_pthread_wqthread","symbolLocation":292,"imageIndex":16},{"imageOffset":2240,"symbol":"start_wqthread","symbolLocation":8,"imageIndex":16}]},{"triggered":true,"id":106844,"threadState":{"x":[{"value":0},{"value":0},{"value":0},{"value":0},{"value":1134522},{"value":26},{"value":18446744072631617535},{"value":18446726482597246976},{"value":16098199906471800331},{"value":16098199900753829387},{"value":2},{"value":1099511627776},{"value":4294967293},{"value":0},{"value":0},{"value":0},{"value":328},{"value":6103986176},{"value":0},{"value":6},{"value":4867},{"value":6103986400},{"value":4849336966747728640},{"value":5644314112},{"value":5652059152},{"value":0},{"value":0},{"value":0},{"value":276}],"flavor":"ARM_THREAD_STATE64","lr":{"value":8585426960},"cpsr":{"value":1073741824},"fp":{"value":6103983792},"sp":{"value":6103983760},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":9944535244,"matchesCrashFrame":1},"far":{"value":0}},"queue":"com.meta.react.turbomodulemanager.queue","frames":[{"imageOffset":45260,"symbol":"__pthread_kill","symbolLocation":8,"imageIndex":6},{"imageOffset":30736,"symbol":"pthread_kill","symbolLocation":268,"imageIndex":16},{"imageOffset":491364,"symbol":"abort","symbolLocation":124,"imageIndex":17},{"imageOffset":75784,"symbol":"__abort_message","symbolLocation":132,"imageIndex":18},{"imageOffset":5228,"symbol":"demangling_terminate_handler()","symbolLocation":280,"imageIndex":18},{"imageOffset":212872,"symbol":"_objc_terminate()","symbolLocation":172,"imageIndex":19},{"imageOffset":72668,"symbol":"std::__terminate(void (*)())","symbolLocation":16,"imageIndex":18},{"imageOffset":87496,"symbol":"__cxa_rethrow","symbolLocation":188,"imageIndex":18},{"imageOffset":263512,"symbol":"objc_exception_rethrow","symbolLocation":44,"imageIndex":19},{"imageOffset":3192136,"symbol":"invocation function for block in facebook::react::ObjCTurboModule::performVoidMethodInvocation(facebook::jsi::Runtime&, char const*, NSInvocation*, NSMutableArray*)","symbolLocation":192,"imageIndex":1},{"imageOffset":3212500,"symbol":"std::__1::__function::__func<facebook::react::ObjCTurboModule::performVoidMethodInvocation(facebook::jsi::Runtime&, char const*, NSInvocation*, NSMutableArray*)::$_1, std::__1::allocator<facebook::react::ObjCTurboModule::performVoidMethodInvocation(facebook::jsi::Runtime&, char const*, NSInvocation*, NSMutableArray*)::$_1>, void ()>::operator()()","symbolLocation":88,"imageIndex":1},{"imageOffset":6876,"symbol":"_dispatch_call_block_and_release","symbolLocation":32,"imageIndex":14},{"imageOffset":112636,"symbol":"_dispatch_client_callout","symbolLocation":16,"imageIndex":14},{"imageOffset":42088,"symbol":"_dispatch_lane_serial_drain","symbolLocation":740,"imageIndex":14},{"imageOffset":44868,"symbol":"_dispatch_lane_invoke","symbolLocation":388,"imageIndex":14},{"imageOffset":87020,"symbol":"_dispatch_root_queue_drain_deferred_wlh","symbolLocation":292,"imageIndex":14},{"imageOffset":85220,"symbol":"_dispatch_workloop_worker_thread","symbolLocation":692,"imageIndex":14},{"imageOffset":5048,"symbol":"_pthread_wqthread","symbolLocation":292,"imageIndex":16},{"imageOffset":2240,"symbol":"start_wqthread","symbolLocation":8,"imageIndex":16}]},{"id":106845,"frames":[],"threadState":{"x":[{"value":6104559616},{"value":10243},{"value":6104023040},{"value":0},{"value":409604},{"value":18446744073709551615},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0}],"flavor":"ARM_THREAD_STATE64","lr":{"value":0},"cpsr":{"value":0},"fp":{"value":0},"sp":{"value":6104559616},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":8585398456},"far":{"value":0}}},{"id":106846,"frames":[],"threadState":{"x":[{"value":6105133056},{"value":9731},{"value":6104596480},{"value":0},{"value":409604},{"value":18446744073709551615},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0}],"flavor":"ARM_THREAD_STATE64","lr":{"value":0},"cpsr":{"value":0},"fp":{"value":0},"sp":{"value":6105133056},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":8585398456},"far":{"value":0}}},{"id":106847,"frames":[],"threadState":{"x":[{"value":6105706496},{"value":16131},{"value":6105169920},{"value":0},{"value":409604},{"value":18446744073709551615},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0}],"flavor":"ARM_THREAD_STATE64","lr":{"value":0},"cpsr":{"value":0},"fp":{"value":0},"sp":{"value":6105706496},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":8585398456},"far":{"value":0}}},{"id":106849,"name":"com.apple.uikit.eventfetch-thread","threadState":{"x":[{"value":268451845},{"value":21592279046},{"value":8589934592},{"value":58287001174016},{"value":2162692},{"value":58287001174016},{"value":2},{"value":4294967295},{"value":0},{"value":0},{"value":2},{"value":0},{"value":0},{"value":13571},{"value":4381756264},{"value":5641617408},{"value":18446744073709551569},{"value":1023533448},{"value":0},{"value":4294967295},{"value":2},{"value":58287001174016},{"value":2162692},{"value":58287001174016},{"value":6106275208},{"value":8589934592},{"value":21592279046},{"value":18446744073709550527},{"value":11268505600,"symbolLocation":0,"symbol":"_libkernel_string_functions"}],"flavor":"ARM_THREAD_STATE64","lr":{"value":9944507128},"cpsr":{"value":0},"fp":{"value":6106275056},"sp":{"value":6106274976},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":9944493268},"far":{"value":0}},"frames":[{"imageOffset":3284,"symbol":"mach_msg2_trap","symbolLocation":8,"imageIndex":6},{"imageOffset":17144,"symbol":"mach_msg2_internal","symbolLocation":76,"imageIndex":6},{"imageOffset":16916,"symbol":"mach_msg_overwrite","symbolLocation":428,"imageIndex":6},{"imageOffset":16476,"symbol":"mach_msg","symbolLocation":24,"imageIndex":6},{"imageOffset":288872,"symbol":"__CFRunLoopServiceMachPort","symbolLocation":160,"imageIndex":7},{"imageOffset":120904,"symbol":"__CFRunLoopRun","symbolLocation":1188,"imageIndex":7},{"imageOffset":117356,"symbol":"_CFRunLoopRunSpecificWithOptions","symbolLocation":532,"imageIndex":7},{"imageOffset":10104660,"symbol":"-[NSRunLoop(NSRunLoop) runMode:beforeDate:]","symbolLocation":212,"imageIndex":13},{"imageOffset":10105132,"symbol":"-[NSRunLoop(NSRunLoop) runUntilDate:]","symbolLocation":64,"imageIndex":13},{"imageOffset":471188,"symbol":"-[UIEventFetcher threadMain]","symbolLocation":408,"imageIndex":9},{"imageOffset":401948,"symbol":"__NSThread__start__","symbolLocation":732,"imageIndex":13},{"imageOffset":17484,"symbol":"_pthread_start","symbolLocation":136,"imageIndex":16},{"imageOffset":2252,"symbol":"thread_start","symbolLocation":8,"imageIndex":16}]},{"id":106850,"frames":[],"threadState":{"x":[{"value":6106853376},{"value":20227},{"value":6106316800},{"value":0},{"value":409604},{"value":18446744073709551615},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0}],"flavor":"ARM_THREAD_STATE64","lr":{"value":0},"cpsr":{"value":0},"fp":{"value":0},"sp":{"value":6106853376},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":8585398456},"far":{"value":0}}},{"id":106852,"frames":[],"threadState":{"x":[{"value":6107426816},{"value":18179},{"value":6106890240},{"value":0},{"value":409604},{"value":18446744073709551615},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0}],"flavor":"ARM_THREAD_STATE64","lr":{"value":0},"cpsr":{"value":0},"fp":{"value":0},"sp":{"value":6107426816},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":8585398456},"far":{"value":0}}},{"id":106855,"name":"com.facebook.react.runtime.JavaScript","threadState":{"x":[{"value":268451845},{"value":21592279046},{"value":8589934592},{"value":135252815118336},{"value":0},{"value":135252815118336},{"value":2},{"value":4294967295},{"value":0},{"value":0},{"value":2},{"value":0},{"value":0},{"value":31491},{"value":768},{"value":0},{"value":18446744073709551569},{"value":3298534884098},{"value":0},{"value":4294967295},{"value":2},{"value":135252815118336},{"value":0},{"value":135252815118336},{"value":6107995560},{"value":8589934592},{"value":21592279046},{"value":18446744073709550527},{"value":11268505600,"symbolLocation":0,"symbol":"_libkernel_string_functions"}],"flavor":"ARM_THREAD_STATE64","lr":{"value":9944507128},"cpsr":{"value":0},"fp":{"value":6107995408},"sp":{"value":6107995328},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":9944493268},"far":{"value":0}},"frames":[{"imageOffset":3284,"symbol":"mach_msg2_trap","symbolLocation":8,"imageIndex":6},{"imageOffset":17144,"symbol":"mach_msg2_internal","symbolLocation":76,"imageIndex":6},{"imageOffset":16916,"symbol":"mach_msg_overwrite","symbolLocation":428,"imageIndex":6},{"imageOffset":16476,"symbol":"mach_msg","symbolLocation":24,"imageIndex":6},{"imageOffset":288872,"symbol":"__CFRunLoopServiceMachPort","symbolLocation":160,"imageIndex":7},{"imageOffset":120904,"symbol":"__CFRunLoopRun","symbolLocation":1188,"imageIndex":7},{"imageOffset":117356,"symbol":"_CFRunLoopRunSpecificWithOptions","symbolLocation":532,"imageIndex":7},{"imageOffset":2756256,"symbol":"+[RCTJSThreadManager runRunLoop]","symbolLocation":252,"imageIndex":1},{"imageOffset":401948,"symbol":"__NSThread__start__","symbolLocation":732,"imageIndex":13},{"imageOffset":17484,"symbol":"_pthread_start","symbolLocation":136,"imageIndex":16},{"imageOffset":2252,"symbol":"thread_start","symbolLocation":8,"imageIndex":16}]},{"id":106856,"name":"hades","threadState":{"x":[{"value":260},{"value":0},{"value":0},{"value":0},{"value":0},{"value":160},{"value":0},{"value":0},{"value":6108573352},{"value":0},{"value":0},{"value":2},{"value":2},{"value":0},{"value":0},{"value":0},{"value":305},{"value":8825137984},{"value":0},{"value":5642206208},{"value":5642206272},{"value":6108573920},{"value":0},{"value":0},{"value":0},{"value":1},{"value":256},{"value":0},{"value":0}],"flavor":"ARM_THREAD_STATE64","lr":{"value":8585407320},"cpsr":{"value":1610612736},"fp":{"value":6108573472},"sp":{"value":6108573328},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":9944516052},"far":{"value":0}},"frames":[{"imageOffset":26068,"symbol":"__psynch_cvwait","symbolLocation":8,"imageIndex":6},{"imageOffset":11096,"symbol":"_pthread_cond_wait","symbolLocation":984,"imageIndex":16},{"imageOffset":141060,"symbol":"std::__1::condition_variable::wait(std::__1::unique_lock<std::__1::mutex>&)","symbolLocation":32,"imageIndex":20},{"imageOffset":850372,"symbol":"hermes::vm::HadesGC::Executor::worker()","symbolLocation":116,"imageIndex":3},{"imageOffset":850220,"symbol":"void* std::__1::__thread_proxy[abi:nn180100]<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct>>, hermes::vm::HadesGC::Executor::Executor()::'lambda'()>>(void*)","symbolLocation":44,"imageIndex":3},{"imageOffset":17484,"symbol":"_pthread_start","symbolLocation":136,"imageIndex":16},{"imageOffset":2252,"symbol":"thread_start","symbolLocation":8,"imageIndex":16}]},{"id":106857,"name":"AudioSession - RootQueue","threadState":{"x":[{"value":14},{"value":4294966935222747140},{"value":999999916},{"value":68719460488},{"value":0},{"value":0},{"value":5651792960},{"value":18446726482597246976},{"value":999999916},{"value":3},{"value":13835058055282163714},{"value":80000000},{"value":5651340856},{"value":299101527292042},{"value":8798919080,"symbolLocation":0,"symbol":"OBJC_CLASS_$_OS_os_log"},{"value":8798919080,"symbolLocation":0,"symbol":"OBJC_CLASS_$_OS_os_log"},{"value":18446744073709551578},{"value":6109147136},{"value":0},{"value":108867034049},{"value":5650728448},{"value":1000000000},{"value":5650728312},{"value":6109147360},{"value":0},{"value":0},{"value":18446744071411073023},{"value":0},{"value":0}],"flavor":"ARM_THREAD_STATE64","lr":{"value":7983421132},"cpsr":{"value":2147483648},"fp":{"value":6109146944},"sp":{"value":6109146912},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":9944493160},"far":{"value":0}},"frames":[{"imageOffset":3176,"symbol":"semaphore_timedwait_trap","symbolLocation":8,"imageIndex":6},{"imageOffset":222924,"symbol":"_dispatch_sema4_timedwait","symbolLocation":64,"imageIndex":14},{"imageOffset":16008,"symbol":"_dispatch_semaphore_wait_slow","symbolLocation":76,"imageIndex":14},{"imageOffset":81216,"symbol":"_dispatch_worker_thread","symbolLocation":324,"imageIndex":14},{"imageOffset":17484,"symbol":"_pthread_start","symbolLocation":136,"imageIndex":16},{"imageOffset":2252,"symbol":"thread_start","symbolLocation":8,"imageIndex":16}]},{"id":106862,"name":"hades","threadState":{"x":[{"value":260},{"value":0},{"value":0},{"value":0},{"value":0},{"value":160},{"value":0},{"value":0},{"value":6109720232},{"value":0},{"value":0},{"value":2},{"value":2},{"value":0},{"value":0},{"value":0},{"value":305},{"value":8825137984},{"value":0},{"value":5650100608},{"value":5650100672},{"value":6109720800},{"value":0},{"value":0},{"value":0},{"value":1},{"value":256},{"value":0},{"value":0}],"flavor":"ARM_THREAD_STATE64","lr":{"value":8585407320},"cpsr":{"value":1610612736},"fp":{"value":6109720352},"sp":{"value":6109720208},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":9944516052},"far":{"value":0}},"frames":[{"imageOffset":26068,"symbol":"__psynch_cvwait","symbolLocation":8,"imageIndex":6},{"imageOffset":11096,"symbol":"_pthread_cond_wait","symbolLocation":984,"imageIndex":16},{"imageOffset":141060,"symbol":"std::__1::condition_variable::wait(std::__1::unique_lock<std::__1::mutex>&)","symbolLocation":32,"imageIndex":20},{"imageOffset":850372,"symbol":"hermes::vm::HadesGC::Executor::worker()","symbolLocation":116,"imageIndex":3},{"imageOffset":850220,"symbol":"void* std::__1::__thread_proxy[abi:nn180100]<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct>>, hermes::vm::HadesGC::Executor::Executor()::'lambda'()>>(void*)","symbolLocation":44,"imageIndex":3},{"imageOffset":17484,"symbol":"_pthread_start","symbolLocation":136,"imageIndex":16},{"imageOffset":2252,"symbol":"thread_start","symbolLocation":8,"imageIndex":16}]}],
  "usedImages" : [
  {
    "source" : "P",
    "arch" : "arm64",
    "base" : 4364599296,
    "size" : 6225920,
    "uuid" : "587ce0b4-08eb-397a-aebb-af4ad5841a25",
    "path" : "\/var\/containers\/Bundle\/Application\/96B4F5A7-F2E6-47D6-94F0-5AF8EEF4914C\/Divi.app\/Divi",
    "name" : "Divi"
  },
  {
    "source" : "P",
    "arch" : "arm64",
    "base" : 4387160064,
    "size" : 4440064,
    "uuid" : "d6367361-9590-3fe5-bbab-2a3ad49a83e8",
    "path" : "\/private\/var\/containers\/Bundle\/Application\/96B4F5A7-F2E6-47D6-94F0-5AF8EEF4914C\/Divi.app\/Frameworks\/React.framework\/React",
    "name" : "React"
  },
  {
    "source" : "P",
    "arch" : "arm64",
    "base" : 4376887296,
    "size" : 557056,
    "uuid" : "b35f1182-b82e-3372-8a74-a4fe502c0906",
    "path" : "\/private\/var\/containers\/Bundle\/Application\/96B4F5A7-F2E6-47D6-94F0-5AF8EEF4914C\/Divi.app\/Frameworks\/ReactNativeDependencies.framework\/ReactNativeDependencies",
    "name" : "ReactNativeDependencies"
  },
  {
    "source" : "P",
    "arch" : "arm64",
    "base" : 4398759936,
    "size" : 2113536,
    "uuid" : "ba3c949a-7707-3472-b346-d3e0690c88d0",
    "path" : "\/private\/var\/containers\/Bundle\/Application\/96B4F5A7-F2E6-47D6-94F0-5AF8EEF4914C\/Divi.app\/Frameworks\/hermes.framework\/hermes",
    "name" : "hermes"
  },
  {
    "source" : "P",
    "arch" : "arm64e",
    "base" : 4373086208,
    "size" : 49152,
    "uuid" : "1954b963-897d-321f-88be-880ecef5b408",
    "path" : "\/private\/preboot\/Cryptexes\/OS\/usr\/lib\/libobjc-trampolines.dylib",
    "name" : "libobjc-trampolines.dylib"
  },
  {
    "source" : "P",
    "arch" : "arm64e",
    "base" : 4373495808,
    "size" : 81920,
    "uuid" : "95fa94bd-585e-3d41-a483-10d722bc5efe",
    "path" : "\/System\/Library\/AccessibilityBundles\/GAXClient.bundle\/GAXClient",
    "name" : "GAXClient"
  },
  {
    "source" : "P",
    "arch" : "arm64e",
    "base" : 9944489984,
    "size" : 240940,
    "uuid" : "8d830129-2cbe-32a9-b61e-ce493eecb399",
    "path" : "\/usr\/lib\/system\/libsystem_kernel.dylib",
    "name" : "libsystem_kernel.dylib"
  },
  {
    "source" : "P",
    "arch" : "arm64e",
    "base" : 7029878784,
    "size" : 5793600,
    "uuid" : "2f32d384-4637-3018-843e-4fc875b865c4",
    "path" : "\/System\/Library\/Frameworks\/CoreFoundation.framework\/CoreFoundation",
    "name" : "CoreFoundation"
  },
  {
    "source" : "P",
    "arch" : "arm64e",
    "base" : 9791537152,
    "size" : 34816,
    "uuid" : "12a401ff-9664-3602-9f17-f3047446e62b",
    "path" : "\/System\/Library\/PrivateFrameworks\/GraphicsServices.framework\/GraphicsServices",
    "name" : "GraphicsServices"
  },
  {
    "source" : "P",
    "arch" : "arm64e",
    "base" : 7124443136,
    "size" : 38140352,
    "uuid" : "c768f963-a0cc-3f5c-a1d3-2e06d53a2381",
    "path" : "\/System\/Library\/PrivateFrameworks\/UIKitCore.framework\/UIKitCore",
    "name" : "UIKitCore"
  },
  {
    "source" : "P",
    "arch" : "arm64e",
    "base" : 6979493888,
    "size" : 652108,
    "uuid" : "8acdb580-8ab7-38c0-a586-e667adb1c11c",
    "path" : "\/usr\/lib\/dyld",
    "name" : "dyld"
  },
  {
    "size" : 0,
    "source" : "A",
    "base" : 0,
    "uuid" : "00000000-0000-0000-0000-000000000000"
  },
  {
    "source" : "P",
    "arch" : "arm64e",
    "base" : 8588750848,
    "size" : 1190976,
    "uuid" : "cb06e30f-e030-3d7d-b67d-6c067a7bd715",
    "path" : "\/System\/Library\/PrivateFrameworks\/CloudSubscriptionFeatures.framework\/CloudSubscriptionFeatures",
    "name" : "CloudSubscriptionFeatures"
  },
  {
    "source" : "P",
    "arch" : "arm64e",
    "base" : 6986076160,
    "size" : 14970016,
    "uuid" : "42c593bb-89fb-3ec4-8220-c746811e7a43",
    "path" : "\/System\/Library\/Frameworks\/Foundation.framework\/Foundation",
    "name" : "Foundation"
  },
  {
    "source" : "P",
    "arch" : "arm64e",
    "base" : 7983198208,
    "size" : 287264,
    "uuid" : "904d48a3-d99e-3962-bfa9-c3dfb66bba83",
    "path" : "\/usr\/lib\/system\/libdispatch.dylib",
    "name" : "libdispatch.dylib"
  },
  {
    "source" : "P",
    "arch" : "arm64e",
    "base" : 7270916096,
    "size" : 1068672,
    "uuid" : "1ad53847-7b48-3e4a-bf49-4e5c8b366351",
    "path" : "\/System\/Library\/PrivateFrameworks\/AXCoreUtilities.framework\/AXCoreUtilities",
    "name" : "AXCoreUtilities"
  },
  {
    "source" : "P",
    "arch" : "arm64e",
    "base" : 8585396224,
    "size" : 50272,
    "uuid" : "4f94107b-94d2-3e88-8542-f5403c581b50",
    "path" : "\/usr\/lib\/system\/libsystem_pthread.dylib",
    "name" : "libsystem_pthread.dylib"
  },
  {
    "source" : "P",
    "arch" : "arm64e",
    "base" : 7224037376,
    "size" : 525744,
    "uuid" : "61a33aa9-d668-3b35-a859-b6925c4047b9",
    "path" : "\/usr\/lib\/system\/libsystem_c.dylib",
    "name" : "libsystem_c.dylib"
  },
  {
    "source" : "P",
    "arch" : "arm64e",
    "base" : 6980149248,
    "size" : 108232,
    "uuid" : "754a4876-c719-3686-9d9f-2bd3aa38cd9c",
    "path" : "\/usr\/lib\/libc++abi.dylib",
    "name" : "libc++abi.dylib"
  },
  {
    "source" : "P",
    "arch" : "arm64e",
    "base" : 6978961408,
    "size" : 334688,
    "uuid" : "4358daf9-7758-3542-a1e1-9f185534a911",
    "path" : "\/usr\/lib\/libobjc.A.dylib",
    "name" : "libobjc.A.dylib"
  },
  {
    "source" : "P",
    "arch" : "arm64e",
    "base" : 7285084160,
    "size" : 601636,
    "uuid" : "1ba945bc-7f65-386a-8a4c-f74caab2a260",
    "path" : "\/usr\/lib\/libc++.1.dylib",
    "name" : "libc++.1.dylib"
  }
],
  "sharedCache" : {
  "base" : 6978355200,
  "size" : 5209702400,
  "uuid" : "2e59e585-7e9d-3ae5-9e08-fc063e17b0f2"
},
  "vmSummary" : "ReadOnly portion of Libraries: Total=1.7G resident=0K(0%) swapped_out_or_unallocated=1.7G(100%)\nWritable regions: Total=121.8M written=481K(0%) resident=481K(0%) swapped_out=0K(0%) unallocated=121.4M(100%)\n\n                                VIRTUAL   REGION \nREGION TYPE                        SIZE    COUNT (non-coalesced) \n===========                     =======  ======= \n.note.gnu.proper                    320        1 \nActivity Tracing                   256K        1 \nAudio                               64K        1 \nCoreAnimation                       48K        3 \nFoundation                          16K        1 \nKernel Alloc Once                   32K        1 \nMALLOC                            90.9M       15 \nMALLOC guard page                 3424K        4 \nSTACK GUARD                        224K       14 \nStack                             8080K       14 \nVM_ALLOCATE                       22.1M       18 \n__AUTH                            7851K      699 \n__AUTH_CONST                     101.2M     1086 \n__CTF                               824        1 \n__DATA                            46.5M     1038 \n__DATA_CONST                      34.0M     1095 \n__DATA_DIRTY                      9618K      957 \n__FONT_DATA                        2352        1 \n__INFO_FILTER                         8        1 \n__LINKEDIT                       186.6M        7 \n__OBJC_RO                         84.3M        1 \n__OBJC_RW                         3179K        1 \n__TEXT                             1.5G     1116 \n__TPRO_CONST                       128K        2 \nmapped file                       39.1M        6 \npage table in kernel               481K        1 \nshared memory                       80K        4 \n===========                     =======  ======= \nTOTAL                              2.1G     6089 \n",
  "legacyInfo" : {
  "threadTriggered" : {
    "queue" : "com.meta.react.turbomodulemanager.queue"
  }
},
  "logWritingSignature" : "5113bbb9a554f56cc5b6607007bbb75dd19683e6",
  "bug_type" : "309",
  "roots_installed" : 0,
  "trmStatus" : 1,
  "trialInfo" : {
  "rollouts" : [
    {
      "rolloutId" : "6761d0c9df60af01adb250fb",
      "factorPackIds" : [

      ],
      "deploymentId" : 240000009
    },
    {
      "rolloutId" : "67181b10c68c361a728c7cfa",
      "factorPackIds" : [
        "67181d8ac68c361a728c7cfc"
      ],
      "deploymentId" : 240000005
    }
  ],
  "experiments" : [
    {
      "treatmentId" : "ede3209a-74f5-4df6-8ab2-49adebef92a4",
      "experimentId" : "69c58cc2a1c8055a26cc2a27",
      "deploymentId" : 400000006
    }
  ]
}
}

