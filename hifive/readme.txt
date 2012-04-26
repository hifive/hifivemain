hifiveMain
----------------------------------------------
This is for the development of "hifive".
This file describes how to build CSS and EJS version and release and development for hifive.

1.Clone of the repository
  $ git clone git@github.com:hifive-labs/hifivemain.git

2.Add the libraries required to build using Apache ivy
　　Run the resolve target of hifive / ivy_build.xml.

　　-From the command line
   $ cd hifive
   $ ant -buildfile ivy_build.xml
   
  -From IDE (eclipse)
   Import the project hifive -> context menu of "hifive/ivy_build.xml" -> Run As -> Ant Build

3.Run the build hifive
　　Run the build target of hifive / build_for_js.xml.

　　-From the command line
   $ cd hifive
   $ ant -buildfile build_for_js.xml
   
  -From IDE (eclipse)
   context menu of "hifive/build_for_js.xml" -> Run As -> Ant Build
   
　　Then input version......
　　  hifive/src/main/webapp/release/
     ejs.js
     h5.css
     h5.dev.js
     h5.js
   is generated!!!!