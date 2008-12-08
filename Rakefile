# Copyright 2008 Appcelerator, Inc.
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.
#
require 'fileutils'
require 'yaml'

# 
# Build file for building the application and packaging it into a set of 
# platform installers
# 
# You can just run 'rake' on each package and build the appropriate installer
#
# On OSX for example, you can cross-build for Win32 + OSX if you install the 
# NSIS port
#

# read in the name of the app
config = YAML::load_file(File.join('config','appcelerator.config'))
APPNAME = config[:name]

# read in the version for the app
require "rexml/document"
include REXML
doc = Document.new(File.new(File.join('config','tiapp.xml')))
APPVERSION = XPath.first(doc,'//version').text
URL = XPath.first(doc,'//homepage').text
NAME = XPath.first(doc,'//name').text


task :setup do
	FileUtils.mkdir_p 'stage'
end

task :default => [:osx, :win32] do
end

def echo_system(cmd)
	puts "> #{cmd}"
	system cmd
end

def get_app_folder
	# can be a different case so we search for it
	Dir["/Volumes/*"].each do |name|
		if File.basename(name).downcase == APPNAME.downcase
			return Dir["#{name}/*.app"].first
		end
	end
	raise "couldn't determine the folder name"
end

#
# OSX build + installer maker dohicky
#
task :osx => [:setup] do
	dir = File.expand_path(File.join('stage',APPNAME))
	img = File.expand_path(File.join('stage',"#{APPNAME}.sparseimage"))
	FileUtils.rm_rf [dir,img]
	echo_system "app package:project osx"
	unmount = nil
	begin
		echo_system "hdiutil unmount /Volumes/#{APPNAME} 2>/dev/null"
		echo_system "hdiutil convert config/#{APPNAME}.dmg -format UDSP -o #{dir}"
		echo_system "hdiutil mount #{img}"
		folder = get_app_folder
		unmount = File.dirname(folder)
		FileUtils.cp_r File.join('stage',"#{APPNAME}.app","Contents"),folder
		echo_system "hdiutil eject #{unmount}"
		FileUtils.rm_rf "#{dir}.dmg"
		echo_system "hdiutil convert -format UDZO -o #{dir}.dmg -imagekey zlib-level=9 #{img}"
	ensure
		echo_system "hdiutil eject #{unmount} 2>/dev/null"
	end
end

#
# Bless Win32s heart - she's a little 'slow' these days
# 
task :win32 => [:setup] do
	if not system "makensis -VERSION"
		$stderr.puts "You cannot build the Win32 installer until you install NSIS and put it on your path"
		$stderr.puts "Download from http://nsis.sourceforge.net or on OSX do a 'port install nsis'"
		exit 1
	end
	FileUtils.mkdir_p File.join('stage','win32')
	FileUtils.cp_r File.join('config/.'), File.join('stage','win32')
#temp
	system 'app package:project win32'
	FileUtils.cp_r File.join('stage','tweetanium.win32'), File.join('stage','win32','app')
	ver = APPVERSION.scan('\.').length
	appversion = APPVERSION
	# NSIS requires 0.0.0
	while ver < 3 do
		ver += 1
		appversion = appversion + '.0'
	end
	FileUtils.cd('stage/win32') do
		echo_system "makensis -DURL=\"#{URL}\" -DCOMPANY=\"#{NAME}\" -DAPPNAME=\"#{NAME.downcase}\" -DNAME=\"#{NAME}\" -DVERSION=\"#{appversion}\" installer.nsi"
		FileUtils.cp 'installer.exe', File.expand_path(File.join('..',"#{APPNAME}.exe"))
	end
end


