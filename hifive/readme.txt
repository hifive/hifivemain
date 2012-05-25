hifiveMain
----------------------------------------------
This is for the development of "hifive".
This file describes how to build CSS and EJS version and release and development for hifive.

1.Clone of the repository
  $ git clone git@github.com:hifive/hifivemain.git

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
------------------------------------------------------------
Here's how the test run of hifive.

1.Clone a repository, get the library.(1,2 item above)

2.Download the jscoverage jscoverage.exe to place a "jsTool / jscoverage"
  - http://siliconforks.com/jscoverage/
  
3.Run the "jscoverage" target of build_for_js.xml.

4.Place the following files to the "lib / selenium".
  - firebug-x.x.x-fx.xpi  http://getfirebug.com/
  - chromedriver          http://code.google.com/p/selenium/
  
5.Add a library is shown below in "src / main / webapp / lib".
  - ejs
  - jqplugins
  - jquery
  - syntaxhighlighter
  - modernizr.js

6.To run the CoverageMargeTest.
  - From IDE (eclipse)
  1.Install the tomcat plug-in, make the settings.
  - http://www.eclipsetotale.com/tomcatPlugin.html
  
  2.Tomcat update the definition.
  
  3.Tomcat startup.
  
  4.Junit run in "CoverageMargeTest".