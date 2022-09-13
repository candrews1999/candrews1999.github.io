import requests
from pprint import PrettyPrinter
import pandas as pd
pp = PrettyPrinter()

#api key and url for accessing api
apiKey = '7e2fceb6'
data_URL = 'http://www.omdbapi.com/?apikey='+apiKey

#create pandas dataframe from DisneyMoviesDataset.csv
df = pd.read_csv('DisneyMoviesDataset.csv')

#Create list of titles and release dates to reference
titles = df['Title'].tolist()
releaseDates = df['ReleaseDateShortHand'].tolist()

#params for communicating what I want from api
params = {
    't':"",
    'y':"",
}

#create empty list to hold imbd (fan) scores, metacritic (critic) scores, and box office earnings data
listOfFanScores = []
listOfCriticScores = []
listOfBoxOffice = []

#create list accumulator for indicies that need to be removed
indiciesToRemove = []

#add imbdRating (fan score), Metascore (critic score), and Box Office for each movie title to list accumulators
for index in range(len(titles)):
    
    #get response (from release date year and movie title) in the form of a json from OMBD
    params['t'] = titles[index]
    print(titles[index])
    params['y'] = releaseDates[index][0:4]
    response = requests.get(data_URL,params=params).json()
    
    #see if response has a imbdRating (fan score), Metascore (critic score), and Box Office 
    try:
        fanRating = response['imdbRating']
        criticRating = response['Metascore']
        boxOffice = response['BoxOffice']
        
    #if any of these fields is not present then save index in indiciesToRemove
    except:
        #append placeholders to new columns because this movie was not found and lists must contain same number of elements as csv rows
        listOfFanScores.append("Placeholder")
        listOfCriticScores.append("Placeholder")
        listOfBoxOffice.append("Placeholder")
        
        #append index of item to indiciesToRemove (which will be used to reference the element within titles and releasedates lists to delete later)
        indiciesToRemove.append(index)
       
    #if all fields are present then retrieve data from OMBD response and add imbdRating (fan score), Metascore (critic score), and Box Office 
    else:
        #get information from response
        fanRating = response['imdbRating']
        criticRating = response['Metascore']
        boxOffice = response['BoxOffice']
        
        #add information from response to list accumulators
        listOfFanScores.append(fanRating)
        listOfCriticScores.append(criticRating)
        listOfBoxOffice.append(boxOffice)
        
#create new column for ratings (fan + critic) and box office earnings using accumulated list of data from OMBD responses
df['FanRating'] = listOfFanScores
df['CriticRating'] = listOfCriticScores
df['BoxOffice'] = listOfCriticScores
        
#loop back through indiciesToRemove, removing the movie with the matching title and release year at each index from the csv
for index in indiciesToRemove:
    
    #Save movie title and release year to remove
    movieTitleToRemove = titles[index]
    releaseYearToRemove = releaseDates[index]
    
    #Remove match from csv
    df.drop(df.index[(df['Title'] == movieTitleToRemove) & (df['ReleaseDateShortHand'] == releaseYearToRemove)], inplace=True)   

#save csv with ratings and box office
df.to_csv('DisneyMovieswithRatingsAndBoxOffice.csv')