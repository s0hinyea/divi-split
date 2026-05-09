-------------------------------------
Translated Report (Full Report Below)
-------------------------------------
Process:             Divi [12420]
Path:                /private/var/containers/Bundle/Application/43A5C20D-4C46-493F-8172-3B65724505A3/Divi.app/Divi
Identifier:          com.sohi.divi
Version:             1.0.0 (43)
AppStoreTools:       17F41
AppVariant:          1:iPhone18,2:26
Beta:                YES
Code Type:           ARM-64 (Native)
Role:                Foreground
Parent Process:      launchd [1]
Coalition:           com.sohi.divi [1572]
User ID:             501

Date/Time:           2026-05-09 13:51:31.7556 -0400
Launch Time:         2026-05-09 13:51:31.4536 -0400
Hardware Model:      iPhone18,2
OS Version:          iPhone OS 26.4.2 (23E261)
Release Type:        User
Baseband Version:    1.55.04

Beta Identifier:     5F9ACA34-DFD5-4B35-8E6B-346C359422DC
Incident Identifier: 9CFDBBFA-06D5-4BAE-A1EF-15C0CFB87091

Time Awake Since Boot: 76000 seconds

Triggered by Thread: 1, Dispatch Queue: com.facebook.react.ExceptionsManagerQueue

Exception Type:    EXC_CRASH (SIGABRT)
Exception Codes:   0x0000000000000000, 0x0000000000000000

Termination Reason:  Namespace SIGNAL, Code 6, Abort trap: 6
Terminating Process: Divi [12420]


Application Specific Information:
abort() called


Last Exception Backtrace:
0   CoreFoundation                	       0x188a9fc70 __exceptionPreprocess + 164
1   libobjc.A.dylib               	       0x185575224 objc_exception_throw + 88
2   Divi                          	       0x1028b4db0 0x1026a0000 + 2182576
3   Divi                          	       0x1029252cc 0x1026a0000 + 2642636
4   Divi                          	       0x102925d08 0x1026a0000 + 2645256
5   CoreFoundation                	       0x1889ee454 __invoking___ + 148
6   CoreFoundation                	       0x1889ee2d8 -[NSInvocation invoke] + 424
7   CoreFoundation                	       0x188a03e5c -[NSInvocation invokeWithTarget:] + 64
8   Divi                          	       0x1028e63b0 0x1026a0000 + 2384816
9   Divi                          	       0x1028e84f4 0x1026a0000 + 2393332
10  Divi                          	       0x1028e8158 0x1026a0000 + 2392408
11  libdispatch.dylib             	       0x1c2bd49a8 _dispatch_call_block_and_release + 32
12  libdispatch.dylib             	       0x1c2bee1e4 _dispatch_client_callout + 16
13  libdispatch.dylib             	       0x1c2bdcfb0 _dispatch_lane_serial_drain + 740
14  libdispatch.dylib             	       0x1c2bddaac _dispatch_lane_invoke + 392
15  libdispatch.dylib             	       0x1c2be7dac _dispatch_root_queue_drain_deferred_wlh + 284
16  libdispatch.dylib             	       0x1c2be76ac _dispatch_workloop_worker_thread + 720
17  libsystem_pthread.dylib       	       0x1e77d43b0 _pthread_wqthread + 292
18  libsystem_pthread.dylib       	       0x1e77d38c0 start_wqthread + 8

Thread 0 name:   Dispatch queue: com.apple.main-thread
Thread 0:
0   libsystem_kernel.dylib        	       0x23782ccd4 mach_msg2_trap + 8
1   libsystem_kernel.dylib        	       0x23783030c mach_msg2_internal + 76
2   libsystem_kernel.dylib        	       0x23783022c mach_msg_overwrite + 424
3   libsystem_kernel.dylib        	       0x237830078 mach_msg + 24
4   CoreFoundation                	       0x1889efea4 __CFRunLoopServiceMachPort + 160
5   CoreFoundation                	       0x1889b9f94 __CFRunLoopRun + 1188
6   CoreFoundation                	       0x1889b91d0 _CFRunLoopRunSpecificWithOptions + 532
7   GraphicsServices              	       0x22def7498 GSEventRunModal + 120
8   UIKitCore                     	       0x18e67d2c4 -[UIApplication _run] + 796
9   UIKitCore                     	       0x18e5e8158 UIApplicationMain + 332
10  Divi                          	       0x1026a5620 0x1026a0000 + 22048
11  dyld                          	       0x1855cdc1c start + 6928

Thread 1 name:   Dispatch queue: com.facebook.react.ExceptionsManagerQueue
Thread 1 Crashed:
0   libsystem_kernel.dylib        	       0x2378371d0 __pthread_kill + 8
1   libsystem_pthread.dylib       	       0x1e77da7dc pthread_kill + 268
2   libsystem_c.dylib             	       0x194504de4 abort + 148
3   libc++abi.dylib               	       0x185675fd4 __abort_message + 132
4   libc++abi.dylib               	       0x185677b90 demangling_terminate_handler() + 296
5   libobjc.A.dylib               	       0x185577868 _objc_terminate() + 156
6   libc++abi.dylib               	       0x1856821f8 std::__terminate(void (*)()) + 16
7   libc++abi.dylib               	       0x185675dcc __cxa_rethrow + 188
8   libobjc.A.dylib               	       0x185583b58 objc_exception_rethrow + 44
9   Divi                          	       0x1028e873c 0x1026a0000 + 2393916
10  Divi                          	       0x1028e8158 0x1026a0000 + 2392408
11  libdispatch.dylib             	       0x1c2bd49a8 _dispatch_call_block_and_release + 32
12  libdispatch.dylib             	       0x1c2bee1e4 _dispatch_client_callout + 16
13  libdispatch.dylib             	       0x1c2bdcfb0 _dispatch_lane_serial_drain + 740
14  libdispatch.dylib             	       0x1c2bddaac _dispatch_lane_invoke + 392
15  libdispatch.dylib             	       0x1c2be7dac _dispatch_root_queue_drain_deferred_wlh + 284
16  libdispatch.dylib             	       0x1c2be76ac _dispatch_workloop_worker_thread + 720
17  libsystem_pthread.dylib       	       0x1e77d43b0 _pthread_wqthread + 292
18  libsystem_pthread.dylib       	       0x1e77d38c0 start_wqthread + 8

Thread 2 name:   Dispatch queue: com.facebook.react.AsyncLocalStorageQueue
Thread 2:
0   libsystem_kernel.dylib        	       0x237832784 __open + 8
1   libsystem_kernel.dylib        	       0x237832770 open + 40
2   libswiftDarwin.dylib          	       0x2a91a0b40 _fcntl_overlay_open + 24
3   Foundation                    	       0x186439b38 specialized closure #1 in String.withFileSystemRepresentation<A>(_:) + 88
4   Foundation                    	       0x185c34f58 readBytesFromFile(path:reportProgress:maxLength:options:attributesToRead:attributes:) + 612
5   Foundation                    	       0x185f4875c specialized static NSData._readBytesAndEncoding(fromPath:maxLength:encoding:bytes:length:didMap:options:reportProgress:) + 1080
6   Foundation                    	       0x185f482d4 @objc static NSData._readBytesAndEncoding(fromPath:maxLength:encoding:bytes:length:didMap:options:reportProgress:) + 108
7   Foundation                    	       0x185f48198 -[NSString initWithContentsOfFile:usedEncoding:error:] + 116
8   Foundation                    	       0x186649aa8 +[NSString stringWithContentsOfFile:usedEncoding:error:] + 52
9   Divi                          	       0x102854fc0 0x1026a0000 + 1789888
10  Divi                          	       0x102855744 0x1026a0000 + 1791812
11  Divi                          	       0x1028564a0 0x1026a0000 + 1795232
12  Divi                          	       0x102855cc0 0x1026a0000 + 1793216
13  Divi                          	       0x102856114 0x1026a0000 + 1794324
14  CoreFoundation                	       0x1889ee454 __invoking___ + 148
15  CoreFoundation                	       0x1889ee2d8 -[NSInvocation invoke] + 424
16  CoreFoundation                	       0x188a03e5c -[NSInvocation invokeWithTarget:] + 64
17  Divi                          	       0x1028e63b0 0x1026a0000 + 2384816
18  Divi                          	       0x1028e84f4 0x1026a0000 + 2393332
19  Divi                          	       0x1028e8158 0x1026a0000 + 2392408
20  libdispatch.dylib             	       0x1c2bd49a8 _dispatch_call_block_and_release + 32
21  libdispatch.dylib             	       0x1c2bee1e4 _dispatch_client_callout + 16
22  libdispatch.dylib             	       0x1c2bdcfb0 _dispatch_lane_serial_drain + 740
23  libdispatch.dylib             	       0x1c2bddaac _dispatch_lane_invoke + 392
24  libdispatch.dylib             	       0x1c2be7dac _dispatch_root_queue_drain_deferred_wlh + 284
25  libdispatch.dylib             	       0x1c2be76ac _dispatch_workloop_worker_thread + 720
26  libsystem_pthread.dylib       	       0x1e77d43b0 _pthread_wqthread + 292
27  libsystem_pthread.dylib       	       0x1e77d38c0 start_wqthread + 8

Thread 3:

Thread 4 name:   Dispatch queue: AXBinaryMonitorQueue
Thread 4:
0   libsystem_kernel.dylib        	       0x237832614 lstat + 8
1   Foundation                    	       0x185c3998c _NSResolveSymlinksInPathUsingCache + 668
2   Foundation                    	       0x185c3969c -[NSString(NSPathUtilities) _stringByResolvingSymlinksInPathUsingCache:] + 128
3   Foundation                    	       0x185cee36c _NSFrameworkPathFromLibraryPath + 52
4   Foundation                    	       0x1865bdcbc __25+[NSBundle allFrameworks]_block_invoke + 228
5   libdispatch.dylib             	       0x1c2bee1e4 _dispatch_client_callout + 16
6   libdispatch.dylib             	       0x1c2bd75b0 _dispatch_once_callout + 32
7   Foundation                    	       0x1865bdbd4 +[NSBundle allFrameworks] + 84
8   AXCoreUtilities               	       0x1972762ac __43-[AXBinaryMonitor evaluateExistingBinaries]_block_invoke + 100
9   libdispatch.dylib             	       0x1c2bd49a8 _dispatch_call_block_and_release + 32
10  libdispatch.dylib             	       0x1c2bee1e4 _dispatch_client_callout + 16
11  libdispatch.dylib             	       0x1c2bdcfb0 _dispatch_lane_serial_drain + 740
12  libdispatch.dylib             	       0x1c2bddae4 _dispatch_lane_invoke + 448
13  libdispatch.dylib             	       0x1c2be7dac _dispatch_root_queue_drain_deferred_wlh + 284
14  libdispatch.dylib             	       0x1c2be76ac _dispatch_workloop_worker_thread + 720
15  libsystem_pthread.dylib       	       0x1e77d43b0 _pthread_wqthread + 292
16  libsystem_pthread.dylib       	       0x1e77d38c0 start_wqthread + 8

Thread 5:

Thread 6:

Thread 7 name:  com.apple.uikit.eventfetch-thread
Thread 7:
0   libsystem_kernel.dylib        	       0x23782ccd4 mach_msg2_trap + 8
1   libsystem_kernel.dylib        	       0x23783030c mach_msg2_internal + 76
2   libsystem_kernel.dylib        	       0x23783022c mach_msg_overwrite + 424
3   libsystem_kernel.dylib        	       0x237830078 mach_msg + 24
4   CoreFoundation                	       0x1889efea4 __CFRunLoopServiceMachPort + 160
5   CoreFoundation                	       0x1889b9f94 __CFRunLoopRun + 1188
6   CoreFoundation                	       0x1889b91d0 _CFRunLoopRunSpecificWithOptions + 532
7   Foundation                    	       0x185c2ccf0 -[NSRunLoop(NSRunLoop) runMode:beforeDate:] + 212
8   Foundation                    	       0x185c2cbd8 -[NSRunLoop(NSRunLoop) runUntilDate:] + 64
9   UIKitCore                     	       0x18e642afc -[UIEventFetcher threadMain] + 420
10  Foundation                    	       0x185cb0804 __NSThread__start__ + 732
11  libsystem_pthread.dylib       	       0x1e77d7438 _pthread_start + 136
12  libsystem_pthread.dylib       	       0x1e77d38cc thread_start + 8

Thread 8:

Thread 9:

Thread 10:

Thread 11:

Thread 12 name:  com.facebook.react.JavaScript
Thread 12:
0   libsystem_kernel.dylib        	       0x23782ccd4 mach_msg2_trap + 8
1   libsystem_kernel.dylib        	       0x23783030c mach_msg2_internal + 76
2   libsystem_kernel.dylib        	       0x23783022c mach_msg_overwrite + 424
3   libsystem_kernel.dylib        	       0x237830078 mach_msg + 24
4   CoreFoundation                	       0x1889efea4 __CFRunLoopServiceMachPort + 160
5   CoreFoundation                	       0x1889b9f94 __CFRunLoopRun + 1188
6   CoreFoundation                	       0x1889b91d0 _CFRunLoopRunSpecificWithOptions + 532
7   Divi                          	       0x1028c8b28 0x1026a0000 + 2263848
8   Foundation                    	       0x185cb0804 __NSThread__start__ + 732
9   libsystem_pthread.dylib       	       0x1e77d7438 _pthread_start + 136
10  libsystem_pthread.dylib       	       0x1e77d38cc thread_start + 8

Thread 13 name:  hades
Thread 13:
0   libsystem_kernel.dylib        	       0x2378325e8 __psynch_cvwait + 8
1   libsystem_pthread.dylib       	       0x1e77d5b48 _pthread_cond_wait + 980
2   libc++.1.dylib                	       0x19807ebcc std::__1::condition_variable::wait(std::__1::unique_lock<std::__1::mutex>&) + 32
3   hermes                        	       0x103ddb9c4 hermes::vm::HadesGC::Executor::worker() + 116
4   hermes                        	       0x103ddb92c void* std::__1::__thread_proxy[abi:nn180100]<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct>>, hermes::vm::HadesGC::Executor::Executor()::'lambda'()>>(void*) + 44
5   libsystem_pthread.dylib       	       0x1e77d7438 _pthread_start + 136
6   libsystem_pthread.dylib       	       0x1e77d38cc thread_start + 8

Thread 14 name:  AudioSession - RootQueue
Thread 14:
0   libsystem_kernel.dylib        	       0x23782cc68 semaphore_timedwait_trap + 8
1   libdispatch.dylib             	       0x1c2c097d8 _dispatch_sema4_timedwait + 64
2   libdispatch.dylib             	       0x1c2bd6a68 _dispatch_semaphore_wait_slow + 76
3   libdispatch.dylib             	       0x1c2be66fc _dispatch_worker_thread + 324
4   libsystem_pthread.dylib       	       0x1e77d7438 _pthread_start + 136
5   libsystem_pthread.dylib       	       0x1e77d38cc thread_start + 8


Thread 1 crashed with ARM Thread State (64-bit):
    x0: 0x0000000000000000   x1: 0x0000000000000000   x2: 0x0000000000000000   x3: 0x0000000000000000
    x4: 0x0000000185684cd3   x5: 0x000000016d7e66f0   x6: 0x000000000000006e   x7: 0xfffff0003ffff800
    x8: 0xadcbb79c06cfce9f   x9: 0xadcbb79d6bb1be9f  x10: 0x0000000000000002  x11: 0x00000000fffffffd
   x12: 0x0000000000000000  x13: 0x0000000000000000  x14: 0x0000000000000000  x15: 0x0000000000000000
   x16: 0x0000000000000148  x17: 0x000000016d7e7000  x18: 0x0000000000000000  x19: 0x0000000000000006
   x20: 0x0000000000001a0f  x21: 0x000000016d7e70e0  x22: 0x434c4e47432b2b00  x23: 0x000000014f0c8900
   x24: 0x0000000000000001  x25: 0x000000014f0c95c0  x26: 0x000000014f829d21  x27: 0x000000014f815140
   x28: 0x000000014f8299c1   fp: 0x000000016d7e6660   lr: 0x00000001e77da7dc
    sp: 0x000000016d7e6640   pc: 0x00000002378371d0 cpsr: 0x40000000
   far: 0x0000000000000000  esr: 0x56000080 (Syscall)

Binary Images:
       0x1026a0000 -        0x103213fff Divi arm64  <10554ee2177739f4a4d82f100aa0439b> /private/var/containers/Bundle/Application/43A5C20D-4C46-493F-8172-3B65724505A3/Divi.app/Divi
       0x103d0c000 -        0x103f0ffff hermes arm64  <80d5528f2c783b90b90f747e89a9f880> /private/var/containers/Bundle/Application/43A5C20D-4C46-493F-8172-3B65724505A3/Divi.app/Frameworks/hermes.framework/hermes
       0x1036cc000 -        0x1036d7fff libobjc-trampolines.dylib arm64e  <e51a481b92f532ba9e8bfcecda3b8431> /private/preboot/Cryptexes/OS/usr/lib/libobjc-trampolines.dylib
       0x103798000 -        0x1037abfff GAXClient arm64e  <24a2464592733d4fa59704cea271aaa6> /System/Library/AccessibilityBundles/GAXClient.bundle/GAXClient
       0x23782c000 -        0x237867ac7 libsystem_kernel.dylib arm64e  <5f4e68e1021c3a8fa6f62c4c077d0676> /usr/lib/system/libsystem_kernel.dylib
       0x18898b000 -        0x188f270ff CoreFoundation arm64e  <11f13078e01b343ba0208d60bae7bbb6> /System/Library/Frameworks/CoreFoundation.framework/CoreFoundation
       0x22def6000 -        0x22defe7bf GraphicsServices arm64e  <4e01d837d3923b40abd3ff5755b93327> /System/Library/PrivateFrameworks/GraphicsServices.framework/GraphicsServices
       0x18e55c000 -        0x190a9b3bf UIKitCore arm64e  <32c1b300a6013e148b533419a2d2f234> /System/Library/PrivateFrameworks/UIKitCore.framework/UIKitCore
       0x1855c9000 -        0x18566debf dyld arm64e  <80dd1800f68d354f81068cb5ea621aca> /usr/lib/dyld
               0x0 - 0xffffffffffffffff ??? unknown-arch  <00000000000000000000000000000000> ???
       0x1e77d3000 -        0x1e77df4ef libsystem_pthread.dylib arm64e  <6c9bcde9819d345d9d71b60ad47e5159> /usr/lib/system/libsystem_pthread.dylib
       0x19448e000 -        0x19450d30f libsystem_c.dylib arm64e  <08196a2fb3fa3d0bb151ad50a6d0a0b4> /usr/lib/system/libsystem_c.dylib
       0x18566e000 -        0x18568859f libc++abi.dylib arm64e  <e7bd32f9ab56392d8e79857cde598da1> /usr/lib/libc++abi.dylib
       0x185544000 -        0x18559547f libobjc.A.dylib arm64e  <dbe3f13eefc431c5b7623455cee83e7f> /usr/lib/libobjc.A.dylib
       0x1c2bd3000 -        0x1c2c195ff libdispatch.dylib arm64e  <5fcac52f01e93bf08aac42c442c53560> /usr/lib/system/libdispatch.dylib
       0x2a91a0000 -        0x2a91a26b7 libswiftDarwin.dylib arm64e  <cc7baf8462c13cb8a65637ae2258e81b> /usr/lib/swift/libswiftDarwin.dylib
       0x185c22000 -        0x186aaa45f Foundation arm64e  <66bf417c1d003457a302196bbaec23d0> /System/Library/Frameworks/Foundation.framework/Foundation
       0x19724f000 -        0x19735bc1f AXCoreUtilities arm64e  <9266418b3a003d01803b40a1cea7fb6a> /System/Library/PrivateFrameworks/AXCoreUtilities.framework/AXCoreUtilities
       0x198072000 -        0x198102a7b libc++.1.dylib arm64e  <c3f6d9de52273c4cbec3bd43bfb08435> /usr/lib/libc++.1.dylib

VM Region Summary:
ReadOnly portion of Libraries: Total=1.7G resident=0K(0%) swapped_out_or_unallocated=1.7G(100%)
Writable regions: Total=117.7M written=481K(0%) resident=481K(0%) swapped_out=0K(0%) unallocated=117.2M(100%)

                                VIRTUAL   REGION 
REGION TYPE                        SIZE    COUNT (non-coalesced) 
===========                     =======  ======= 
Activity Tracing                   256K        1 
Audio                               64K        1 
CoreAnimation                       48K        3 
Foundation                          16K        1 
Kernel Alloc Once                   32K        1 
MALLOC                            30.8M       14 
MALLOC guard page                 3296K        4 
Memory Tag 22                     64.0M        1 
STACK GUARD                        240K       15 
Stack                             8624K       15 
VM_ALLOCATE                       13.1M       11 
__AUTH                            8350K      728 
__AUTH_CONST                     105.6M     1147 
__CTF                               824        1 
__DATA                            48.2M     1092 
__DATA_CONST                      36.7M     1156 
__DATA_DIRTY                      9889K     1014 
__FONT_DATA                        2352        1 
__LINKEDIT                       184.9M        5 
__OBJC_RO                         85.0M        1 
__OBJC_RW                         3209K        1 
__TEXT                             1.6G     1172 
__TPRO_CONST                       128K        2 
mapped file                       49.2M        9 
page table in kernel               481K        1 
shared memory                       80K        4 
===========                     =======  ======= 
TOTAL                              2.2G     6401 


-----------
Full Report
-----------

{"roots_installed":0,"app_cohort":"2|date=1778347800000&sf=143441&tid=e335e0dd68400d70939cad54b9e18bad9ea0c729978e9d82009d978466f44cff&ttype=i","app_name":"Divi","app_version":"1.0.0","timestamp":"2026-05-09 13:51:32.00 -0400","slice_uuid":"10554ee2-1777-39f4-a4d8-2f100aa0439b","adam_id":"6762031093","build_version":"43","platform":2,"bundleID":"com.sohi.divi","share_with_app_devs":0,"is_first_party":0,"bug_type":"309","os_version":"iPhone OS 26.4.2 (23E261)","incident_id":"9CFDBBFA-06D5-4BAE-A1EF-15C0CFB87091","name":"Divi","is_beta":1}
{
  "uptime" : 76000,
  "procRole" : "Foreground",
  "version" : 2,
  "userID" : 501,
  "deployVersion" : 210,
  "modelCode" : "iPhone18,2",
  "coalitionID" : 1572,
  "osVersion" : {
    "isEmbedded" : true,
    "train" : "iPhone OS 26.4.2",
    "releaseType" : "User",
    "build" : "23E261"
  },
  "captureTime" : "2026-05-09 13:51:31.7556 -0400",
  "codeSigningMonitor" : 2,
  "incident" : "9CFDBBFA-06D5-4BAE-A1EF-15C0CFB87091",
  "pid" : 12420,
  "translated" : false,
  "cpuType" : "ARM-64",
  "procLaunch" : "2026-05-09 13:51:31.4536 -0400",
  "procStartAbsTime" : 1832662341344,
  "procExitAbsTime" : 1832668575428,
  "procName" : "Divi",
  "procPath" : "\/private\/var\/containers\/Bundle\/Application\/43A5C20D-4C46-493F-8172-3B65724505A3\/Divi.app\/Divi",
  "bundleInfo" : {"CFBundleShortVersionString":"1.0.0","CFBundleVersion":"43","CFBundleIdentifier":"com.sohi.divi","DTAppStoreToolsBuild":"17F41"},
  "storeInfo" : {"itemID":"6762031093","storeCohortMetadata":"2|date=1778347800000&sf=143441&tid=e335e0dd68400d70939cad54b9e18bad9ea0c729978e9d82009d978466f44cff&ttype=i","entitledBeta":true,"deviceIdentifierForVendor":"5F9ACA34-DFD5-4B35-8E6B-346C359422DC","distributorID":"com.apple.TestFlight","softwareVersionExternalIdentifier":"211409643","applicationVariant":"1:iPhone18,2:26","thirdParty":true},
  "parentProc" : "launchd",
  "parentPid" : 1,
  "coalitionName" : "com.sohi.divi",
  "isBeta" : 1,
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
  "instructionByteStream" : {"beforePC":"fyMD1f17v6n9AwCR0+3\/l78DAJH9e8Go\/w9f1sADX9YQKYDSARAA1A==","atPC":"AwEAVH8jA9X9e7+p\/QMAkcjt\/5e\/AwCR\/XvBqP8PX9bAA1\/WECeA0g=="},
  "bootSessionUUID" : "7701EA1B-CACB-4936-9069-1F0811F86CC6",
  "basebandVersion" : "1.55.04",
  "exception" : {"codes":"0x0000000000000000, 0x0000000000000000","rawCodes":[0,0],"type":"EXC_CRASH","signal":"SIGABRT"},
  "termination" : {"flags":0,"code":6,"namespace":"SIGNAL","indicator":"Abort trap: 6","byProc":"Divi","byPid":12420},
  "asi" : {"libsystem_c.dylib":["abort() called"]},
  "lastExceptionBacktrace" : [{"imageOffset":1133680,"symbol":"__exceptionPreprocess","symbolLocation":164,"imageIndex":5},{"imageOffset":201252,"symbol":"objc_exception_throw","symbolLocation":88,"imageIndex":13},{"imageOffset":2182576,"imageIndex":0},{"imageOffset":2642636,"imageIndex":0},{"imageOffset":2645256,"imageIndex":0},{"imageOffset":406612,"symbol":"__invoking___","symbolLocation":148,"imageIndex":5},{"imageOffset":406232,"symbol":"-[NSInvocation invoke]","symbolLocation":424,"imageIndex":5},{"imageOffset":495196,"symbol":"-[NSInvocation invokeWithTarget:]","symbolLocation":64,"imageIndex":5},{"imageOffset":2384816,"imageIndex":0},{"imageOffset":2393332,"imageIndex":0},{"imageOffset":2392408,"imageIndex":0},{"imageOffset":6568,"symbol":"_dispatch_call_block_and_release","symbolLocation":32,"imageIndex":14},{"imageOffset":111076,"symbol":"_dispatch_client_callout","symbolLocation":16,"imageIndex":14},{"imageOffset":40880,"symbol":"_dispatch_lane_serial_drain","symbolLocation":740,"imageIndex":14},{"imageOffset":43692,"symbol":"_dispatch_lane_invoke","symbolLocation":392,"imageIndex":14},{"imageOffset":85420,"symbol":"_dispatch_root_queue_drain_deferred_wlh","symbolLocation":284,"imageIndex":14},{"imageOffset":83628,"symbol":"_dispatch_workloop_worker_thread","symbolLocation":720,"imageIndex":14},{"imageOffset":5040,"symbol":"_pthread_wqthread","symbolLocation":292,"imageIndex":10},{"imageOffset":2240,"symbol":"start_wqthread","symbolLocation":8,"imageIndex":10}],
  "faultingThread" : 1,
  "threads" : [{"id":1241062,"threadState":{"x":[{"value":268451845},{"value":21592279046},{"value":8589934592},{"value":24202140712960},{"value":0},{"value":24202140712960},{"value":2},{"value":4294967295},{"value":0},{"value":0},{"value":2},{"value":0},{"value":0},{"value":5635},{"value":0},{"value":0},{"value":18446744073709551569},{"value":8393637768},{"value":0},{"value":4294967295},{"value":2},{"value":24202140712960},{"value":0},{"value":24202140712960},{"value":21592279046},{"value":6131409848},{"value":8589934592},{"value":18446744073709550527},{"value":10843275264,"symbolLocation":0,"symbol":"_libkernel_string_functions"}],"flavor":"ARM_THREAD_STATE64","lr":{"value":9521267468},"cpsr":{"value":0},"fp":{"value":6131409696},"sp":{"value":6131409616},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":9521253588},"far":{"value":0}},"queue":"com.apple.main-thread","frames":[{"imageOffset":3284,"symbol":"mach_msg2_trap","symbolLocation":8,"imageIndex":4},{"imageOffset":17164,"symbol":"mach_msg2_internal","symbolLocation":76,"imageIndex":4},{"imageOffset":16940,"symbol":"mach_msg_overwrite","symbolLocation":424,"imageIndex":4},{"imageOffset":16504,"symbol":"mach_msg","symbolLocation":24,"imageIndex":4},{"imageOffset":413348,"symbol":"__CFRunLoopServiceMachPort","symbolLocation":160,"imageIndex":5},{"imageOffset":192404,"symbol":"__CFRunLoopRun","symbolLocation":1188,"imageIndex":5},{"imageOffset":188880,"symbol":"_CFRunLoopRunSpecificWithOptions","symbolLocation":532,"imageIndex":5},{"imageOffset":5272,"symbol":"GSEventRunModal","symbolLocation":120,"imageIndex":6},{"imageOffset":1184452,"symbol":"-[UIApplication _run]","symbolLocation":796,"imageIndex":7},{"imageOffset":573784,"symbol":"UIApplicationMain","symbolLocation":332,"imageIndex":7},{"imageOffset":22048,"imageIndex":0},{"imageOffset":19484,"symbol":"start","symbolLocation":6928,"imageIndex":8}]},{"triggered":true,"id":1241083,"threadState":{"x":[{"value":0},{"value":0},{"value":0},{"value":0},{"value":6533172435},{"value":6131967728},{"value":110},{"value":18446726482597246976},{"value":12523305069590859423},{"value":12523305075578355359},{"value":2},{"value":4294967293},{"value":0},{"value":0},{"value":0},{"value":0},{"value":328},{"value":6131970048},{"value":0},{"value":6},{"value":6671},{"value":6131970272},{"value":4849336966747728640},{"value":5621188864},{"value":1},{"value":5621192128},{"value":5628927265},{"value":5628842304},{"value":5628926401}],"flavor":"ARM_THREAD_STATE64","lr":{"value":8178739164},"cpsr":{"value":1073741824},"fp":{"value":6131967584},"sp":{"value":6131967552},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":9521295824,"matchesCrashFrame":1},"far":{"value":0}},"queue":"com.facebook.react.ExceptionsManagerQueue","frames":[{"imageOffset":45520,"symbol":"__pthread_kill","symbolLocation":8,"imageIndex":4},{"imageOffset":30684,"symbol":"pthread_kill","symbolLocation":268,"imageIndex":10},{"imageOffset":486884,"symbol":"abort","symbolLocation":148,"imageIndex":11},{"imageOffset":32724,"symbol":"__abort_message","symbolLocation":132,"imageIndex":12},{"imageOffset":39824,"symbol":"demangling_terminate_handler()","symbolLocation":296,"imageIndex":12},{"imageOffset":211048,"symbol":"_objc_terminate()","symbolLocation":156,"imageIndex":13},{"imageOffset":82424,"symbol":"std::__terminate(void (*)())","symbolLocation":16,"imageIndex":12},{"imageOffset":32204,"symbol":"__cxa_rethrow","symbolLocation":188,"imageIndex":12},{"imageOffset":260952,"symbol":"objc_exception_rethrow","symbolLocation":44,"imageIndex":13},{"imageOffset":2393916,"imageIndex":0},{"imageOffset":2392408,"imageIndex":0},{"imageOffset":6568,"symbol":"_dispatch_call_block_and_release","symbolLocation":32,"imageIndex":14},{"imageOffset":111076,"symbol":"_dispatch_client_callout","symbolLocation":16,"imageIndex":14},{"imageOffset":40880,"symbol":"_dispatch_lane_serial_drain","symbolLocation":740,"imageIndex":14},{"imageOffset":43692,"symbol":"_dispatch_lane_invoke","symbolLocation":392,"imageIndex":14},{"imageOffset":85420,"symbol":"_dispatch_root_queue_drain_deferred_wlh","symbolLocation":284,"imageIndex":14},{"imageOffset":83628,"symbol":"_dispatch_workloop_worker_thread","symbolLocation":720,"imageIndex":14},{"imageOffset":5040,"symbol":"_pthread_wqthread","symbolLocation":292,"imageIndex":10},{"imageOffset":2240,"symbol":"start_wqthread","symbolLocation":8,"imageIndex":10}]},{"id":1241084,"threadState":{"x":[{"value":4},{"value":0},{"value":0},{"value":18446726483666796544},{"value":5609872256},{"value":175},{"value":18446744072631617535},{"value":18446726482597246976},{"value":0},{"value":16557561840393846963},{"value":6132536344},{"value":8366829352,"symbolLocation":0,"symbol":"OBJC_CLASS_$__TtCs15__StringStorage"},{"value":5609872367},{"value":4},{"value":0},{"value":5609865216},{"value":5},{"value":11640835808},{"value":0},{"value":0},{"value":6132536592},{"value":0},{"value":0},{"value":175},{"value":6132537120},{"value":526},{"value":0},{"value":0},{"value":1}],"flavor":"ARM_THREAD_STATE64","lr":{"value":9521276784},"cpsr":{"value":2147483648},"fp":{"value":6132536496},"sp":{"value":6132536480},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":9521276804},"far":{"value":0}},"queue":"com.facebook.react.AsyncLocalStorageQueue","frames":[{"imageOffset":26500,"symbol":"__open","symbolLocation":8,"imageIndex":4},{"imageOffset":26480,"symbol":"open","symbolLocation":40,"imageIndex":4},{"imageOffset":2880,"symbol":"_fcntl_overlay_open","symbolLocation":24,"imageIndex":15},{"imageOffset":8485688,"symbol":"specialized closure #1 in String.withFileSystemRepresentation<A>(_:)","symbolLocation":88,"imageIndex":16},{"imageOffset":77656,"symbol":"readBytesFromFile(path:reportProgress:maxLength:options:attributesToRead:attributes:)","symbolLocation":612,"imageIndex":16},{"imageOffset":3303260,"symbol":"specialized static NSData._readBytesAndEncoding(fromPath:maxLength:encoding:bytes:length:didMap:options:reportProgress:)","symbolLocation":1080,"imageIndex":16},{"imageOffset":3302100,"symbol":"@objc static NSData._readBytesAndEncoding(fromPath:maxLength:encoding:bytes:length:didMap:options:reportProgress:)","symbolLocation":108,"imageIndex":16},{"imageOffset":3301784,"symbol":"-[NSString initWithContentsOfFile:usedEncoding:error:]","symbolLocation":116,"imageIndex":16},{"imageOffset":10648232,"symbol":"+[NSString stringWithContentsOfFile:usedEncoding:error:]","symbolLocation":52,"imageIndex":16},{"imageOffset":1789888,"imageIndex":0},{"imageOffset":1791812,"imageIndex":0},{"imageOffset":1795232,"imageIndex":0},{"imageOffset":1793216,"imageIndex":0},{"imageOffset":1794324,"imageIndex":0},{"imageOffset":406612,"symbol":"__invoking___","symbolLocation":148,"imageIndex":5},{"imageOffset":406232,"symbol":"-[NSInvocation invoke]","symbolLocation":424,"imageIndex":5},{"imageOffset":495196,"symbol":"-[NSInvocation invokeWithTarget:]","symbolLocation":64,"imageIndex":5},{"imageOffset":2384816,"imageIndex":0},{"imageOffset":2393332,"imageIndex":0},{"imageOffset":2392408,"imageIndex":0},{"imageOffset":6568,"symbol":"_dispatch_call_block_and_release","symbolLocation":32,"imageIndex":14},{"imageOffset":111076,"symbol":"_dispatch_client_callout","symbolLocation":16,"imageIndex":14},{"imageOffset":40880,"symbol":"_dispatch_lane_serial_drain","symbolLocation":740,"imageIndex":14},{"imageOffset":43692,"symbol":"_dispatch_lane_invoke","symbolLocation":392,"imageIndex":14},{"imageOffset":85420,"symbol":"_dispatch_root_queue_drain_deferred_wlh","symbolLocation":284,"imageIndex":14},{"imageOffset":83628,"symbol":"_dispatch_workloop_worker_thread","symbolLocation":720,"imageIndex":14},{"imageOffset":5040,"symbol":"_pthread_wqthread","symbolLocation":292,"imageIndex":10},{"imageOffset":2240,"symbol":"start_wqthread","symbolLocation":8,"imageIndex":10}]},{"id":1241085,"frames":[],"threadState":{"x":[{"value":6133116928},{"value":6147},{"value":6132580352},{"value":0},{"value":409604},{"value":18446744073709551615},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0}],"flavor":"ARM_THREAD_STATE64","lr":{"value":0},"cpsr":{"value":0},"fp":{"value":0},"sp":{"value":6133116928},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":8178710712},"far":{"value":0}}},{"id":1241086,"threadState":{"x":[{"value":2},{"value":0},{"value":8451},{"value":6133681046},{"value":18446744073709550480},{"value":16},{"value":0},{"value":18446726482597246976},{"value":6133690592},{"value":16557561840393846963},{"value":116},{"value":6133682144},{"value":1942063676},{"value":108},{"value":6588924560,"symbolLocation":0,"symbol":"offsetsFromUTF8"},{"value":65533},{"value":340},{"value":8393631048},{"value":0},{"value":13},{"value":0},{"value":1},{"value":67},{"value":6133682369},{"value":0},{"value":6133682357},{"value":6133682235},{"value":18446744067575869314},{"value":12267364604}],"flavor":"ARM_THREAD_STATE64","lr":{"value":6539155852},"cpsr":{"value":1610612736},"fp":{"value":6133684608},"sp":{"value":6133682240},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":9521276436},"far":{"value":0}},"queue":"AXBinaryMonitorQueue","frames":[{"imageOffset":26132,"symbol":"lstat","symbolLocation":8,"imageIndex":4},{"imageOffset":96652,"symbol":"_NSResolveSymlinksInPathUsingCache","symbolLocation":668,"imageIndex":16},{"imageOffset":95900,"symbol":"-[NSString(NSPathUtilities) _stringByResolvingSymlinksInPathUsingCache:]","symbolLocation":128,"imageIndex":16},{"imageOffset":836460,"symbol":"_NSFrameworkPathFromLibraryPath","symbolLocation":52,"imageIndex":16},{"imageOffset":10075324,"symbol":"__25+[NSBundle allFrameworks]_block_invoke","symbolLocation":228,"imageIndex":16},{"imageOffset":111076,"symbol":"_dispatch_client_callout","symbolLocation":16,"imageIndex":14},{"imageOffset":17840,"symbol":"_dispatch_once_callout","symbolLocation":32,"imageIndex":14},{"imageOffset":10075092,"symbol":"+[NSBundle allFrameworks]","symbolLocation":84,"imageIndex":16},{"imageOffset":160428,"symbol":"__43-[AXBinaryMonitor evaluateExistingBinaries]_block_invoke","symbolLocation":100,"imageIndex":17},{"imageOffset":6568,"symbol":"_dispatch_call_block_and_release","symbolLocation":32,"imageIndex":14},{"imageOffset":111076,"symbol":"_dispatch_client_callout","symbolLocation":16,"imageIndex":14},{"imageOffset":40880,"symbol":"_dispatch_lane_serial_drain","symbolLocation":740,"imageIndex":14},{"imageOffset":43748,"symbol":"_dispatch_lane_invoke","symbolLocation":448,"imageIndex":14},{"imageOffset":85420,"symbol":"_dispatch_root_queue_drain_deferred_wlh","symbolLocation":284,"imageIndex":14},{"imageOffset":83628,"symbol":"_dispatch_workloop_worker_thread","symbolLocation":720,"imageIndex":14},{"imageOffset":5040,"symbol":"_pthread_wqthread","symbolLocation":292,"imageIndex":10},{"imageOffset":2240,"symbol":"start_wqthread","symbolLocation":8,"imageIndex":10}]},{"id":1241087,"frames":[],"threadState":{"x":[{"value":6134263808},{"value":10499},{"value":6133727232},{"value":0},{"value":409604},{"value":18446744073709551615},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0}],"flavor":"ARM_THREAD_STATE64","lr":{"value":0},"cpsr":{"value":0},"fp":{"value":0},"sp":{"value":6134263808},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":8178710712},"far":{"value":0}}},{"id":1241088,"frames":[],"threadState":{"x":[{"value":6134837248},{"value":9731},{"value":6134300672},{"value":0},{"value":409604},{"value":18446744073709551615},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0}],"flavor":"ARM_THREAD_STATE64","lr":{"value":0},"cpsr":{"value":0},"fp":{"value":0},"sp":{"value":6134837248},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":8178710712},"far":{"value":0}}},{"id":1241089,"name":"com.apple.uikit.eventfetch-thread","threadState":{"x":[{"value":268451845},{"value":21592279046},{"value":8589934592},{"value":56087977918464},{"value":2162692},{"value":56087977918464},{"value":2},{"value":4294967295},{"value":0},{"value":0},{"value":2},{"value":0},{"value":0},{"value":13059},{"value":4355737232},{"value":5608259584},{"value":18446744073709551569},{"value":18446744072367376383},{"value":0},{"value":4294967295},{"value":2},{"value":56087977918464},{"value":2162692},{"value":56087977918464},{"value":21592279046},{"value":6135405960},{"value":8589934592},{"value":18446744073709550527},{"value":10843275264,"symbolLocation":0,"symbol":"_libkernel_string_functions"}],"flavor":"ARM_THREAD_STATE64","lr":{"value":9521267468},"cpsr":{"value":0},"fp":{"value":6135405808},"sp":{"value":6135405728},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":9521253588},"far":{"value":0}},"frames":[{"imageOffset":3284,"symbol":"mach_msg2_trap","symbolLocation":8,"imageIndex":4},{"imageOffset":17164,"symbol":"mach_msg2_internal","symbolLocation":76,"imageIndex":4},{"imageOffset":16940,"symbol":"mach_msg_overwrite","symbolLocation":424,"imageIndex":4},{"imageOffset":16504,"symbol":"mach_msg","symbolLocation":24,"imageIndex":4},{"imageOffset":413348,"symbol":"__CFRunLoopServiceMachPort","symbolLocation":160,"imageIndex":5},{"imageOffset":192404,"symbol":"__CFRunLoopRun","symbolLocation":1188,"imageIndex":5},{"imageOffset":188880,"symbol":"_CFRunLoopRunSpecificWithOptions","symbolLocation":532,"imageIndex":5},{"imageOffset":44272,"symbol":"-[NSRunLoop(NSRunLoop) runMode:beforeDate:]","symbolLocation":212,"imageIndex":16},{"imageOffset":43992,"symbol":"-[NSRunLoop(NSRunLoop) runUntilDate:]","symbolLocation":64,"imageIndex":16},{"imageOffset":944892,"symbol":"-[UIEventFetcher threadMain]","symbolLocation":420,"imageIndex":7},{"imageOffset":583684,"symbol":"__NSThread__start__","symbolLocation":732,"imageIndex":16},{"imageOffset":17464,"symbol":"_pthread_start","symbolLocation":136,"imageIndex":10},{"imageOffset":2252,"symbol":"thread_start","symbolLocation":8,"imageIndex":10}]},{"id":1241090,"frames":[],"threadState":{"x":[{"value":6135984128},{"value":21251},{"value":6135447552},{"value":0},{"value":409604},{"value":18446744073709551615},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0}],"flavor":"ARM_THREAD_STATE64","lr":{"value":0},"cpsr":{"value":0},"fp":{"value":0},"sp":{"value":6135984128},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":8178710712},"far":{"value":0}}},{"id":1241091,"frames":[],"threadState":{"x":[{"value":6136557568},{"value":20995},{"value":6136020992},{"value":0},{"value":409604},{"value":18446744073709551615},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0}],"flavor":"ARM_THREAD_STATE64","lr":{"value":0},"cpsr":{"value":0},"fp":{"value":0},"sp":{"value":6136557568},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":8178710712},"far":{"value":0}}},{"id":1241092,"frames":[],"threadState":{"x":[{"value":6137131008},{"value":18435},{"value":6136594432},{"value":0},{"value":409604},{"value":18446744073709551615},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0}],"flavor":"ARM_THREAD_STATE64","lr":{"value":0},"cpsr":{"value":0},"fp":{"value":0},"sp":{"value":6137131008},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":8178710712},"far":{"value":0}}},{"id":1241093,"frames":[],"threadState":{"x":[{"value":6137704448},{"value":19203},{"value":6137167872},{"value":0},{"value":409604},{"value":18446744073709551615},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0},{"value":0}],"flavor":"ARM_THREAD_STATE64","lr":{"value":0},"cpsr":{"value":0},"fp":{"value":0},"sp":{"value":6137704448},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":8178710712},"far":{"value":0}}},{"id":1241095,"name":"com.facebook.react.JavaScript","threadState":{"x":[{"value":268451845},{"value":21592279046},{"value":8589934592},{"value":100068443029504},{"value":0},{"value":100068443029504},{"value":2},{"value":4294967295},{"value":0},{"value":0},{"value":2},{"value":0},{"value":0},{"value":23299},{"value":0},{"value":0},{"value":18446744073709551569},{"value":8393637768},{"value":0},{"value":4294967295},{"value":2},{"value":100068443029504},{"value":0},{"value":100068443029504},{"value":21592279046},{"value":6138273224},{"value":8589934592},{"value":18446744073709550527},{"value":10843275264,"symbolLocation":0,"symbol":"_libkernel_string_functions"}],"flavor":"ARM_THREAD_STATE64","lr":{"value":9521267468},"cpsr":{"value":0},"fp":{"value":6138273072},"sp":{"value":6138272992},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":9521253588},"far":{"value":0}},"frames":[{"imageOffset":3284,"symbol":"mach_msg2_trap","symbolLocation":8,"imageIndex":4},{"imageOffset":17164,"symbol":"mach_msg2_internal","symbolLocation":76,"imageIndex":4},{"imageOffset":16940,"symbol":"mach_msg_overwrite","symbolLocation":424,"imageIndex":4},{"imageOffset":16504,"symbol":"mach_msg","symbolLocation":24,"imageIndex":4},{"imageOffset":413348,"symbol":"__CFRunLoopServiceMachPort","symbolLocation":160,"imageIndex":5},{"imageOffset":192404,"symbol":"__CFRunLoopRun","symbolLocation":1188,"imageIndex":5},{"imageOffset":188880,"symbol":"_CFRunLoopRunSpecificWithOptions","symbolLocation":532,"imageIndex":5},{"imageOffset":2263848,"imageIndex":0},{"imageOffset":583684,"symbol":"__NSThread__start__","symbolLocation":732,"imageIndex":16},{"imageOffset":17464,"symbol":"_pthread_start","symbolLocation":136,"imageIndex":10},{"imageOffset":2252,"symbol":"thread_start","symbolLocation":8,"imageIndex":10}]},{"id":1241096,"name":"hades","threadState":{"x":[{"value":260},{"value":0},{"value":0},{"value":0},{"value":0},{"value":160},{"value":0},{"value":0},{"value":6138850984},{"value":0},{"value":0},{"value":2},{"value":2},{"value":0},{"value":0},{"value":0},{"value":305},{"value":8393637528},{"value":0},{"value":5608902592},{"value":5608902656},{"value":6138851552},{"value":0},{"value":0},{"value":0},{"value":1},{"value":256},{"value":0},{"value":0}],"flavor":"ARM_THREAD_STATE64","lr":{"value":8178719560},"cpsr":{"value":1610612736},"fp":{"value":6138851104},"sp":{"value":6138850960},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":9521276392},"far":{"value":0}},"frames":[{"imageOffset":26088,"symbol":"__psynch_cvwait","symbolLocation":8,"imageIndex":4},{"imageOffset":11080,"symbol":"_pthread_cond_wait","symbolLocation":980,"imageIndex":10},{"imageOffset":52172,"symbol":"std::__1::condition_variable::wait(std::__1::unique_lock<std::__1::mutex>&)","symbolLocation":32,"imageIndex":18},{"imageOffset":850372,"symbol":"hermes::vm::HadesGC::Executor::worker()","symbolLocation":116,"imageIndex":1},{"imageOffset":850220,"symbol":"void* std::__1::__thread_proxy[abi:nn180100]<std::__1::tuple<std::__1::unique_ptr<std::__1::__thread_struct, std::__1::default_delete<std::__1::__thread_struct>>, hermes::vm::HadesGC::Executor::Executor()::'lambda'()>>(void*)","symbolLocation":44,"imageIndex":1},{"imageOffset":17464,"symbol":"_pthread_start","symbolLocation":136,"imageIndex":10},{"imageOffset":2252,"symbol":"thread_start","symbolLocation":8,"imageIndex":10}]},{"id":1241099,"name":"AudioSession - RootQueue","threadState":{"x":[{"value":14},{"value":4294967115611373572},{"value":999999958},{"value":68719460488},{"value":0},{"value":0},{"value":5608136480},{"value":18446726482597246976},{"value":999999958},{"value":3},{"value":13835058055282163714},{"value":80000000},{"value":5620585400},{"value":5608084336},{"value":8366723648,"symbolLocation":0,"symbol":"OBJC_CLASS_$_OS_os_log"},{"value":8366723648,"symbolLocation":0,"symbol":"OBJC_CLASS_$_OS_os_log"},{"value":18446744073709551578},{"value":6139424768},{"value":0},{"value":1832787522726},{"value":5608889472},{"value":1000000000},{"value":5608889336},{"value":6139424992},{"value":0},{"value":0},{"value":18446744071411073023},{"value":0},{"value":0}],"flavor":"ARM_THREAD_STATE64","lr":{"value":7562368984},"cpsr":{"value":2147483648},"fp":{"value":6139424576},"sp":{"value":6139424544},"esr":{"value":1442840704,"description":"(Syscall)"},"pc":{"value":9521253480},"far":{"value":0}},"frames":[{"imageOffset":3176,"symbol":"semaphore_timedwait_trap","symbolLocation":8,"imageIndex":4},{"imageOffset":223192,"symbol":"_dispatch_sema4_timedwait","symbolLocation":64,"imageIndex":14},{"imageOffset":14952,"symbol":"_dispatch_semaphore_wait_slow","symbolLocation":76,"imageIndex":14},{"imageOffset":79612,"symbol":"_dispatch_worker_thread","symbolLocation":324,"imageIndex":14},{"imageOffset":17464,"symbol":"_pthread_start","symbolLocation":136,"imageIndex":10},{"imageOffset":2252,"symbol":"thread_start","symbolLocation":8,"imageIndex":10}]}],
  "usedImages" : [
  {
    "source" : "P",
    "arch" : "arm64",
    "base" : 4335468544,
    "size" : 12009472,
    "uuid" : "10554ee2-1777-39f4-a4d8-2f100aa0439b",
    "path" : "\/private\/var\/containers\/Bundle\/Application\/43A5C20D-4C46-493F-8172-3B65724505A3\/Divi.app\/Divi",
    "name" : "Divi"
  },
  {
    "source" : "P",
    "arch" : "arm64",
    "base" : 4358979584,
    "size" : 2113536,
    "uuid" : "80d5528f-2c78-3b90-b90f-747e89a9f880",
    "path" : "\/private\/var\/containers\/Bundle\/Application\/43A5C20D-4C46-493F-8172-3B65724505A3\/Divi.app\/Frameworks\/hermes.framework\/hermes",
    "name" : "hermes"
  },
  {
    "source" : "P",
    "arch" : "arm64e",
    "base" : 4352425984,
    "size" : 49152,
    "uuid" : "e51a481b-92f5-32ba-9e8b-fcecda3b8431",
    "path" : "\/private\/preboot\/Cryptexes\/OS\/usr\/lib\/libobjc-trampolines.dylib",
    "name" : "libobjc-trampolines.dylib"
  },
  {
    "source" : "P",
    "arch" : "arm64e",
    "base" : 4353261568,
    "size" : 81920,
    "uuid" : "24a24645-9273-3d4f-a597-04cea271aaa6",
    "path" : "\/System\/Library\/AccessibilityBundles\/GAXClient.bundle\/GAXClient",
    "name" : "GAXClient"
  },
  {
    "source" : "P",
    "arch" : "arm64e",
    "base" : 9521250304,
    "size" : 244424,
    "uuid" : "5f4e68e1-021c-3a8f-a6f6-2c4c077d0676",
    "path" : "\/usr\/lib\/system\/libsystem_kernel.dylib",
    "name" : "libsystem_kernel.dylib"
  },
  {
    "source" : "P",
    "arch" : "arm64e",
    "base" : 6586675200,
    "size" : 5882112,
    "uuid" : "11f13078-e01b-343b-a020-8d60bae7bbb6",
    "path" : "\/System\/Library\/Frameworks\/CoreFoundation.framework\/CoreFoundation",
    "name" : "CoreFoundation"
  },
  {
    "source" : "P",
    "arch" : "arm64e",
    "base" : 9360596992,
    "size" : 34752,
    "uuid" : "4e01d837-d392-3b40-abd3-ff5755b93327",
    "path" : "\/System\/Library\/PrivateFrameworks\/GraphicsServices.framework\/GraphicsServices",
    "name" : "GraphicsServices"
  },
  {
    "source" : "P",
    "arch" : "arm64e",
    "base" : 6682951680,
    "size" : 39056320,
    "uuid" : "32c1b300-a601-3e14-8b53-3419a2d2f234",
    "path" : "\/System\/Library\/PrivateFrameworks\/UIKitCore.framework\/UIKitCore",
    "name" : "UIKitCore"
  },
  {
    "source" : "P",
    "arch" : "arm64e",
    "base" : 6532403200,
    "size" : 675520,
    "uuid" : "80dd1800-f68d-354f-8106-8cb5ea621aca",
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
    "base" : 8178708480,
    "size" : 50416,
    "uuid" : "6c9bcde9-819d-345d-9d71-b60ad47e5159",
    "path" : "\/usr\/lib\/system\/libsystem_pthread.dylib",
    "name" : "libsystem_pthread.dylib"
  },
  {
    "source" : "P",
    "arch" : "arm64e",
    "base" : 6782771200,
    "size" : 520976,
    "uuid" : "08196a2f-b3fa-3d0b-b151-ad50a6d0a0b4",
    "path" : "\/usr\/lib\/system\/libsystem_c.dylib",
    "name" : "libsystem_c.dylib"
  },
  {
    "source" : "P",
    "arch" : "arm64e",
    "base" : 6533079040,
    "size" : 107936,
    "uuid" : "e7bd32f9-ab56-392d-8e79-857cde598da1",
    "path" : "\/usr\/lib\/libc++abi.dylib",
    "name" : "libc++abi.dylib"
  },
  {
    "source" : "P",
    "arch" : "arm64e",
    "base" : 6531858432,
    "size" : 332928,
    "uuid" : "dbe3f13e-efc4-31c5-b762-3455cee83e7f",
    "path" : "\/usr\/lib\/libobjc.A.dylib",
    "name" : "libobjc.A.dylib"
  },
  {
    "source" : "P",
    "arch" : "arm64e",
    "base" : 7562145792,
    "size" : 288256,
    "uuid" : "5fcac52f-01e9-3bf0-8aac-42c442c53560",
    "path" : "\/usr\/lib\/system\/libdispatch.dylib",
    "name" : "libdispatch.dylib"
  },
  {
    "source" : "P",
    "arch" : "arm64e",
    "base" : 11426988032,
    "size" : 9912,
    "uuid" : "cc7baf84-62c1-3cb8-a656-37ae2258e81b",
    "path" : "\/usr\/lib\/swift\/libswiftDarwin.dylib",
    "name" : "libswiftDarwin.dylib"
  },
  {
    "source" : "P",
    "arch" : "arm64e",
    "base" : 6539059200,
    "size" : 15238240,
    "uuid" : "66bf417c-1d00-3457-a302-196bbaec23d0",
    "path" : "\/System\/Library\/Frameworks\/Foundation.framework\/Foundation",
    "name" : "Foundation"
  },
  {
    "source" : "P",
    "arch" : "arm64e",
    "base" : 6830747648,
    "size" : 1100832,
    "uuid" : "9266418b-3a00-3d01-803b-40a1cea7fb6a",
    "path" : "\/System\/Library\/PrivateFrameworks\/AXCoreUtilities.framework\/AXCoreUtilities",
    "name" : "AXCoreUtilities"
  },
  {
    "source" : "P",
    "arch" : "arm64e",
    "base" : 6845571072,
    "size" : 592508,
    "uuid" : "c3f6d9de-5227-3c4c-bec3-bd43bfb08435",
    "path" : "\/usr\/lib\/libc++.1.dylib",
    "name" : "libc++.1.dylib"
  }
],
  "sharedCache" : {
  "base" : 6531235840,
  "size" : 5386272768,
  "uuid" : "74ffdb77-60e1-3c26-bc62-6e1d8590bb73"
},
  "vmSummary" : "ReadOnly portion of Libraries: Total=1.7G resident=0K(0%) swapped_out_or_unallocated=1.7G(100%)\nWritable regions: Total=117.7M written=481K(0%) resident=481K(0%) swapped_out=0K(0%) unallocated=117.2M(100%)\n\n                                VIRTUAL   REGION \nREGION TYPE                        SIZE    COUNT (non-coalesced) \n===========                     =======  ======= \nActivity Tracing                   256K        1 \nAudio                               64K        1 \nCoreAnimation                       48K        3 \nFoundation                          16K        1 \nKernel Alloc Once                   32K        1 \nMALLOC                            30.8M       14 \nMALLOC guard page                 3296K        4 \nMemory Tag 22                     64.0M        1 \nSTACK GUARD                        240K       15 \nStack                             8624K       15 \nVM_ALLOCATE                       13.1M       11 \n__AUTH                            8350K      728 \n__AUTH_CONST                     105.6M     1147 \n__CTF                               824        1 \n__DATA                            48.2M     1092 \n__DATA_CONST                      36.7M     1156 \n__DATA_DIRTY                      9889K     1014 \n__FONT_DATA                        2352        1 \n__LINKEDIT                       184.9M        5 \n__OBJC_RO                         85.0M        1 \n__OBJC_RW                         3209K        1 \n__TEXT                             1.6G     1172 \n__TPRO_CONST                       128K        2 \nmapped file                       49.2M        9 \npage table in kernel               481K        1 \nshared memory                       80K        4 \n===========                     =======  ======= \nTOTAL                              2.2G     6401 \n",
  "legacyInfo" : {
  "threadTriggered" : {
    "queue" : "com.facebook.react.ExceptionsManagerQueue"
  }
},
  "logWritingSignature" : "e6bb388bc1ddbbc872e31467d3f25c8c6c6804e1",
  "roots_installed" : 0,
  "bug_type" : "309",
  "trmStatus" : 1,
  "sandboxProfileName" : "container",
  "trialInfo" : {
  "rollouts" : [
    {
      "rolloutId" : "648cada15dbc71671bb3aa1b",
      "factorPackIds" : [
        "65a81173096f6a1f1ba46525"
      ],
      "deploymentId" : 240000116
    },
    {
      "rolloutId" : "65a8173205d942272410674b",
      "factorPackIds" : [
        "65d39fa4cb0e2417d11ce5f6"
      ],
      "deploymentId" : 240000001
    }
  ],
  "experiments" : [
    {
      "treatmentId" : "ede3209a-74f5-4df6-8ab2-49adebef92a4",
      "experimentId" : "69c58cc2a1c8055a26cc2a27",
      "deploymentId" : 400000006
    },
    {
      "treatmentId" : "c2e2c4d1-bc93-47ec-b433-5a21317aad4b",
      "experimentId" : "67e32776f470dc0e83d9e147",
      "deploymentId" : 400000009
    }
  ]
}
}

