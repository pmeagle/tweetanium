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

# read in the name of the app
config = YAML::load_file(File.join('config','appcelerator.config'))
APPNAME = config[:name]

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

task :win32 => [:setup] do
end
