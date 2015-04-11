import sqlite3
import json

db = sqlite3.connect('participants.db')

result = db.execute("SELECT * FROM turkdemo WHERE status = '4'")
results = result.fetchall()

num_of_subjects = len(results)
num_of_trials = 300
block_size = 20
average_results = [0] * (num_of_trials / block_size)

file_dat = open('ii_stim.dat', 'r')
ii_data = file_dat.read()
ii_data_arr = ii_data.split("\n")
ii_data_sorted = []

for elem in ii_data_arr:
	split = elem.split(" ")
	if split[0] == "1":
		ii_data_sorted.append(elem)

for elem in ii_data_arr:
	split = elem.split(" ")
	if split[0] == "2":
		ii_data_sorted.append(elem)

file_dat.close()

for r in results:
	# select datastring column
	string = r[16] 
 	json_string = json.loads(string)["data"]
 	counter, trace = 0.0, 1
 	# select trialdata
 	for i in range(3, len(json_string) - 2):
 		word = json_string[i]["trialdata"]["word"]
 		file_name = json_string[i]["trialdata"]["color"]
 		file_id = file_name[22:].split(".")[0]
 		info = ii_data_sorted[int(file_id)].split(" ")
 		x = info[1]
 		y = info[2]
 	 	response = json_string[i]["trialdata"]["response"]
	 	rt = json_string[i]["trialdata"]["rt"]

#/static/images/ii/stim254.png
 		print word + " " + str(x) + " " + str(y) + " " + response

 

