package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	sc "github.com/hyperledger/fabric-protos-go/peer"
	"github.com/hyperledger/fabric/common/flogging"

	"github.com/hyperledger/fabric-chaincode-go/pkg/cid"
)

// SmartContract Define the Smart Contract structure
type SmartContract struct {
}

// Car :  Define the car structure, with 4 properties.  Structure tags are used by encoding/json library
type Product struct {
	Id      string `json:"product_id"`
	Name    string `json:"name"`
	Manf_Id string `json:"manf_id"`
	Owner   string `json:"owner"`
}

// Init ;  Method for initializing smart contract
func (s *SmartContract) Init(APIstub shim.ChaincodeStubInterface) sc.Response {
	return shim.Success(nil)
}

var logger = flogging.MustGetLogger("fabcar_cc")

// Invoke :  Method for INVOKING smart contract
func (s *SmartContract) Invoke(APIstub shim.ChaincodeStubInterface) sc.Response {

	function, args := APIstub.GetFunctionAndParameters()
	logger.Infof("Function name is:  %d", function)
	logger.Infof("Args length is : %d", len(args))

	switch function {
	case "queryProduct":
		return s.queryProduct(APIstub, args)
	case "initLedger":
		return s.initLedger(APIstub)
	//case "queryAllPatient":
	//	return s.queryAllPatients(APIstub)
	case "createProduct":
		return s.createProduct(APIstub, args)
	case "changeProductOwner":
		return s.changeProductOwner(APIstub, args)
	case "getHistoryForAsset":
		return s.getHistoryForAsset(APIstub, args)
	// case "queryCarsByOwner":
	// 	return s.queryCarsByOwner(APIstub, args)
	// case "restictedMethod":
	// 	return s.restictedMethod(APIstub, args)
	// case "test":
	// 	return s.test(APIstub, args)
	// case "createPrivateCar":
	// 	return s.createPrivateCar(APIstub, args)
	// case "readPrivateCar":
	// 	return s.readPrivateCar(APIstub, args)
	// case "updatePrivateData":
	// 	return s.updatePrivateData(APIstub, args)
	// case "readCarPrivateDetails":
	// 	return s.readCarPrivateDetails(APIstub, args)
	// case "createPrivateCarImplicitForOrg1":
	// 	return s.createPrivateCarImplicitForOrg1(APIstub, args)
	// case "createPrivateCarImplicitForOrg2":
	// 	return s.createPrivateCarImplicitForOrg2(APIstub, args)
	// case "queryPrivateDataHash":
	// 	return s.queryPrivateDataHash(APIstub, args)
	default:
		return shim.Error("Invalid Smart Contract function name.")
	}

	// return shim.Error("Invalid Smart Contract function name.")
}

func (s *SmartContract) queryProduct(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	productAsBytes, _ := APIstub.GetState(args[0])
	return shim.Success(productAsBytes)
}

// func (s *SmartContract) readPrivateCar(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

// 	if len(args) != 2 {
// 		return shim.Error("Incorrect number of arguments. Expecting 2")
// 	}
// 	// collectionCars, collectionCarPrivateDetails, _implicit_org_Org1MSP, _implicit_org_Org2MSP
// 	carAsBytes, err := APIstub.GetPrivateData(args[0], args[1])
// 	if err != nil {
// 		jsonResp := "{\"Error\":\"Failed to get private details for " + args[1] + ": " + err.Error() + "\"}"
// 		return shim.Error(jsonResp)
// 	} else if carAsBytes == nil {
// 		jsonResp := "{\"Error\":\"Car private details does not exist: " + args[1] + "\"}"
// 		return shim.Error(jsonResp)
// 	}
// 	return shim.Success(carAsBytes)
// }

// func (s *SmartContract) readPrivateCarIMpleciteForOrg1(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

// 	if len(args) != 1 {
// 		return shim.Error("Incorrect number of arguments. Expecting 1")
// 	}

// 	carAsBytes, _ := APIstub.GetPrivateData("_implicit_org_Org1MSP", args[0])
// 	return shim.Success(carAsBytes)
// }

// func (s *SmartContract) readCarPrivateDetails(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

// 	if len(args) != 1 {
// 		return shim.Error("Incorrect number of arguments. Expecting 1")
// 	}

// 	carAsBytes, err := APIstub.GetPrivateData("collectionCarPrivateDetails", args[0])

// 	if err != nil {
// 		jsonResp := "{\"Error\":\"Failed to get private details for " + args[0] + ": " + err.Error() + "\"}"
// 		return shim.Error(jsonResp)
// 	} else if carAsBytes == nil {
// 		jsonResp := "{\"Error\":\"Marble private details does not exist: " + args[0] + "\"}"
// 		return shim.Error(jsonResp)
// 	}
// 	return shim.Success(carAsBytes)
// }

// func (s *SmartContract) test(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

// 	if len(args) != 1 {
// 		return shim.Error("Incorrect number of arguments. Expecting 1")
// 	}

// 	carAsBytes, _ := APIstub.GetState(args[0])
// 	return shim.Success(carAsBytes)
// }

func (s *SmartContract) initLedger(APIstub shim.ChaincodeStubInterface) sc.Response {
	products := []Product{
		Product{Id: "PROD0", Name: "Boost", Manf_Id: "MNF1001", Owner: "SUP21"},
		Product{Id: "PROD1", Name: "Horlicks", Manf_Id: "MNF1002", Owner: "SUP01"},
		Product{Id: "PROD2", Name: "Adidas", Manf_Id: "MNF1003", Owner: "SUP05"},
		Product{Id: "PROD3", Name: "Adidas", Manf_Id: "MNF1003", Owner: "SUP08"},
		Product{Id: "PROD4", Name: "Rolex", Manf_Id: "MNF1004", Owner: "SUP66"},
	}

	i := 0
	for i < len(products) {
		productAsBytes, _ := json.Marshal(products[i])
		APIstub.PutState("PROD"+strconv.Itoa(i), productAsBytes)
		i = i + 1
	}

	return shim.Success(nil)
}

// func (s *SmartContract) createPrivateCar(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
// 	type carTransientInput struct {
// 		Make  string `json:"make"` //the fieldtags are needed to keep case from bouncing around
// 		Model string `json:"model"`
// 		Color string `json:"color"`
// 		Owner string `json:"owner"`
// 		Price string `json:"price"`
// 		Key   string `json:"key"`
// 	}
// 	if len(args) != 0 {
// 		return shim.Error("1111111----Incorrect number of arguments. Private marble data must be passed in transient map.")
// 	}

// 	logger.Infof("11111111111111111111111111")

// 	transMap, err := APIstub.GetTransient()
// 	if err != nil {
// 		return shim.Error("222222 -Error getting transient: " + err.Error())
// 	}

// 	carDataAsBytes, ok := transMap["car"]
// 	if !ok {
// 		return shim.Error("car must be a key in the transient map")
// 	}
// 	logger.Infof("********************8   " + string(carDataAsBytes))

// 	if len(carDataAsBytes) == 0 {
// 		return shim.Error("333333 -marble value in the transient map must be a non-empty JSON string")
// 	}

// 	logger.Infof("2222222")

// 	var carInput carTransientInput
// 	err = json.Unmarshal(carDataAsBytes, &carInput)
// 	if err != nil {
// 		return shim.Error("44444 -Failed to decode JSON of: " + string(carDataAsBytes) + "Error is : " + err.Error())
// 	}

// 	logger.Infof("3333")

// 	if len(carInput.Key) == 0 {
// 		return shim.Error("name field must be a non-empty string")
// 	}
// 	if len(carInput.Make) == 0 {
// 		return shim.Error("color field must be a non-empty string")
// 	}
// 	if len(carInput.Model) == 0 {
// 		return shim.Error("model field must be a non-empty string")
// 	}
// 	if len(carInput.Color) == 0 {
// 		return shim.Error("color field must be a non-empty string")
// 	}
// 	if len(carInput.Owner) == 0 {
// 		return shim.Error("owner field must be a non-empty string")
// 	}
// 	if len(carInput.Price) == 0 {
// 		return shim.Error("price field must be a non-empty string")
// 	}

// 	logger.Infof("444444")

// 	// ==== Check if car already exists ====
// 	carAsBytes, err := APIstub.GetPrivateData("collectionCars", carInput.Key)
// 	if err != nil {
// 		return shim.Error("Failed to get marble: " + err.Error())
// 	} else if carAsBytes != nil {
// 		fmt.Println("This car already exists: " + carInput.Key)
// 		return shim.Error("This car already exists: " + carInput.Key)
// 	}

// 	logger.Infof("55555")

// 	var car = Car{Make: carInput.Make, Model: carInput.Model, Colour: carInput.Color, Owner: carInput.Owner}

// 	carAsBytes, err = json.Marshal(car)
// 	if err != nil {
// 		return shim.Error(err.Error())
// 	}
// 	err = APIstub.PutPrivateData("collectionCars", carInput.Key, carAsBytes)
// 	if err != nil {
// 		logger.Infof("6666666")
// 		return shim.Error(err.Error())
// 	}

// 	carPrivateDetails := &carPrivateDetails{Owner: carInput.Owner, Price: carInput.Price}

// 	carPrivateDetailsAsBytes, err := json.Marshal(carPrivateDetails)
// 	if err != nil {
// 		logger.Infof("77777")
// 		return shim.Error(err.Error())
// 	}

// 	err = APIstub.PutPrivateData("collectionCarPrivateDetails", carInput.Key, carPrivateDetailsAsBytes)
// 	if err != nil {
// 		logger.Infof("888888")
// 		return shim.Error(err.Error())
// 	}

// 	return shim.Success(carAsBytes)
// }

// func (s *SmartContract) updatePrivateData(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

// 	type carTransientInput struct {
// 		Owner string `json:"owner"`
// 		Price string `json:"price"`
// 		Key   string `json:"key"`
// 	}
// 	if len(args) != 0 {
// 		return shim.Error("1111111----Incorrect number of arguments. Private marble data must be passed in transient map.")
// 	}

// 	logger.Infof("11111111111111111111111111")

// 	transMap, err := APIstub.GetTransient()
// 	if err != nil {
// 		return shim.Error("222222 -Error getting transient: " + err.Error())
// 	}

// 	carDataAsBytes, ok := transMap["car"]
// 	if !ok {
// 		return shim.Error("car must be a key in the transient map")
// 	}
// 	logger.Infof("********************8   " + string(carDataAsBytes))

// 	if len(carDataAsBytes) == 0 {
// 		return shim.Error("333333 -marble value in the transient map must be a non-empty JSON string")
// 	}

// 	logger.Infof("2222222")

// 	var carInput carTransientInput
// 	err = json.Unmarshal(carDataAsBytes, &carInput)
// 	if err != nil {
// 		return shim.Error("44444 -Failed to decode JSON of: " + string(carDataAsBytes) + "Error is : " + err.Error())
// 	}

// 	carPrivateDetails := &carPrivateDetails{Owner: carInput.Owner, Price: carInput.Price}

// 	carPrivateDetailsAsBytes, err := json.Marshal(carPrivateDetails)
// 	if err != nil {
// 		logger.Infof("77777")
// 		return shim.Error(err.Error())
// 	}

// 	err = APIstub.PutPrivateData("collectionCarPrivateDetails", carInput.Key, carPrivateDetailsAsBytes)
// 	if err != nil {
// 		logger.Infof("888888")
// 		return shim.Error(err.Error())
// 	}

// 	return shim.Success(carPrivateDetailsAsBytes)

// }

func (s *SmartContract) createProduct(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 5 {
		return shim.Error("Incorrect number of arguments. Expecting 5")
	}

	var product = Product{Id: args[1], Name: args[2], Manf_Id: args[3], Owner: args[4]}

	productAsBytes, _ := json.Marshal(product)
	APIstub.PutState(args[0], productAsBytes)

	indexName := "owner~key"
	colorNameIndexKey, err := APIstub.CreateCompositeKey(indexName, []string{product.Owner, args[0]})
	if err != nil {
		return shim.Error(err.Error())
	}
	value := []byte{0x00}
	APIstub.PutState(colorNameIndexKey, value)

	return shim.Success(productAsBytes)
}

// func (S *SmartContract) queryCarsByOwner(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

// 	if len(args) != 1 {
// 		return shim.Error("Incorrect number of arguments")
// 	}
// 	owner := args[0]

// 	ownerAndIdResultIterator, err := APIstub.GetStateByPartialCompositeKey("owner~key", []string{owner})
// 	if err != nil {
// 		return shim.Error(err.Error())
// 	}

// 	defer ownerAndIdResultIterator.Close()

// 	var i int
// 	var id string

// 	var cars []byte
// 	bArrayMemberAlreadyWritten := false

// 	cars = append([]byte("["))

// 	for i = 0; ownerAndIdResultIterator.HasNext(); i++ {
// 		responseRange, err := ownerAndIdResultIterator.Next()
// 		if err != nil {
// 			return shim.Error(err.Error())
// 		}

// 		objectType, compositeKeyParts, err := APIstub.SplitCompositeKey(responseRange.Key)
// 		if err != nil {
// 			return shim.Error(err.Error())
// 		}

// 		id = compositeKeyParts[1]
// 		assetAsBytes, err := APIstub.GetState(id)

// 		if bArrayMemberAlreadyWritten == true {
// 			newBytes := append([]byte(","), assetAsBytes...)
// 			cars = append(cars, newBytes...)

// 		} else {
// 			// newBytes := append([]byte(","), carsAsBytes...)
// 			cars = append(cars, assetAsBytes...)
// 		}

// 		fmt.Printf("Found a asset for index : %s asset id : ", objectType, compositeKeyParts[0], compositeKeyParts[1])
// 		bArrayMemberAlreadyWritten = true

// 	}

// 	cars = append(cars, []byte("]")...)

// 	return shim.Success(cars)
// }

// func (s *SmartContract) queryAllPatients(APIstub shim.ChaincodeStubInterface) sc.Response {

// 	startKey := "PAT0"
// 	endKey := "PAT999"

// 	resultsIterator, err := APIstub.GetStateByRange(startKey, endKey)
// 	if err != nil {
// 		return shim.Error(err.Error())
// 	}
// 	defer resultsIterator.Close()

// 	// buffer is a JSON array containing QueryResults
// 	var buffer bytes.Buffer
// 	buffer.WriteString("[")

// 	bArrayMemberAlreadyWritten := false
// 	for resultsIterator.HasNext() {
// 		queryResponse, err := resultsIterator.Next()
// 		if err != nil {
// 			return shim.Error(err.Error())
// 		}
// 		// Add a comma before array members, suppress it for the first array member
// 		if bArrayMemberAlreadyWritten == true {
// 			buffer.WriteString(",")
// 		}
// 		buffer.WriteString("{\"Key\":")
// 		buffer.WriteString("\"")
// 		buffer.WriteString(queryResponse.Key)
// 		buffer.WriteString("\"")

// 		buffer.WriteString(", \"Record\":")
// 		// Record is a JSON object, so we write as-is
// 		buffer.WriteString(string(queryResponse.Value))
// 		buffer.WriteString("}")
// 		bArrayMemberAlreadyWritten = true
// 	}
// 	buffer.WriteString("]")

// 	fmt.Printf("- queryAllPatients:\n%s\n", buffer.String())

// 	return shim.Success(buffer.Bytes())
// }

func (s *SmartContract) restictedMethod(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	// get an ID for the client which is guaranteed to be unique within the MSP
	//id, err := cid.GetID(APIstub) -

	// get the MSP ID of the client's identity
	//mspid, err := cid.GetMSPID(APIstub) -

	// get the value of the attribute
	//val, ok, err := cid.GetAttributeValue(APIstub, "attr1") -

	// get the X509 certificate of the client, or nil if the client's identity was not based on an X509 certificate
	//cert, err := cid.GetX509Certificate(APIstub) -

	val, ok, err := cid.GetAttributeValue(APIstub, "role")
	if err != nil {
		// There was an error trying to retrieve the attribute
		shim.Error("Error while retriving attributes")
	}
	if !ok {
		// The client identity does not possess the attribute
		shim.Error("Client identity doesnot posses the attribute")
	}
	// Do something with the value of 'val'
	if val != "approver" {
		fmt.Println("Attribute role: " + val)
		return shim.Error("Only user with role as APPROVER have access this method!")
	} else {
		if len(args) != 1 {
			return shim.Error("Incorrect number of arguments. Expecting 1")
		}

		patientAsBytes, _ := APIstub.GetState(args[0])
		return shim.Success(patientAsBytes)
	}

}

func (s *SmartContract) changeProductOwner(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	}

	productAsBytes, _ := APIstub.GetState(args[0])
	car := Product{}

	json.Unmarshal(productAsBytes, &car)
	car.Owner = args[1]

	productAsBytes, _ = json.Marshal(car)
	APIstub.PutState(args[0], productAsBytes)

	return shim.Success(productAsBytes)
}

func (t *SmartContract) getHistoryForAsset(stub shim.ChaincodeStubInterface, args []string) sc.Response {

	if len(args) < 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	productName := args[0]

	resultsIterator, err := stub.GetHistoryForKey(productName)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	// buffer is a JSON array containing historic values for the marble
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		// Add a comma before array members, suppress it for the first array member
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"TxId\":")
		buffer.WriteString("\"")
		buffer.WriteString(response.TxId)
		buffer.WriteString("\"")

		buffer.WriteString(", \"Value\":")
		// if it was a delete operation on given key, then we need to set the
		//corresponding value null. Else, we will write the response.Value
		//as-is (as the Value itself a JSON marble)
		if response.IsDelete {
			buffer.WriteString("null")
		} else {
			buffer.WriteString(string(response.Value))
		}

		buffer.WriteString(", \"Timestamp\":")
		buffer.WriteString("\"")
		buffer.WriteString(time.Unix(response.Timestamp.Seconds, int64(response.Timestamp.Nanos)).String())
		buffer.WriteString("\"")

		buffer.WriteString(", \"IsDelete\":")
		buffer.WriteString("\"")
		buffer.WriteString(strconv.FormatBool(response.IsDelete))
		buffer.WriteString("\"")

		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")

	fmt.Printf("- getHistoryForAsset returning:\n%s\n", buffer.String())

	return shim.Success(buffer.Bytes())
}

// func (s *SmartContract) createPrivateCarImplicitForOrg1(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

// 	if len(args) != 5 {
// 		return shim.Error("Incorrect arguments. Expecting 5 arguments")
// 	}

// 	var car = Car{Make: args[1], Model: args[2], Colour: args[3], Owner: args[4]}

// 	carAsBytes, _ := json.Marshal(car)
// 	// APIstub.PutState(args[0], carAsBytes)

// 	err := APIstub.PutPrivateData("_implicit_org_Org1MSP", args[0], carAsBytes)
// 	if err != nil {
// 		return shim.Error("Failed to add asset: " + args[0])
// 	}
// 	return shim.Success(carAsBytes)
// }

// func (s *SmartContract) createPrivateCarImplicitForOrg2(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

// 	if len(args) != 5 {
// 		return shim.Error("Incorrect arguments. Expecting 5 arguments")
// 	}

// 	var car = Car{Make: args[1], Model: args[2], Colour: args[3], Owner: args[4]}

// 	carAsBytes, _ := json.Marshal(car)
// 	APIstub.PutState(args[0], carAsBytes)

// 	err := APIstub.PutPrivateData("_implicit_org_Org2MSP", args[0], carAsBytes)
// 	if err != nil {
// 		return shim.Error("Failed to add asset: " + args[0])
// 	}
// 	return shim.Success(carAsBytes)
// }

// func (s *SmartContract) queryPrivateDataHash(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {

// 	if len(args) != 2 {
// 		return shim.Error("Incorrect number of arguments. Expecting 2")
// 	}
// 	carAsBytes, _ := APIstub.GetPrivateDataHash(args[0], args[1])
// 	return shim.Success(carAsBytes)
// }

// func (s *SmartContract) CreateCarAsset(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
// 	if len(args) != 1 {
// 		return shim.Error("Incorrect number of arguments. Expecting 1")
// 	}

// 	var car Car
// 	err := json.Unmarshal([]byte(args[0]), &car)
// 	if err != nil {
// 		return shim.Error(err.Error())
// 	}

// 	carAsBytes, err := json.Marshal(car)
// 	if err != nil {
// 		return shim.Error(err.Error())
// 	}

// 	err = APIstub.PutState(car.ID, carAsBytes)
// 	if err != nil {
// 		return shim.Error(err.Error())
// 	}

// 	return shim.Success(nil)
// }

// func (s *SmartContract) addBulkAsset(APIstub shim.ChaincodeStubInterface, args []string) sc.Response {
// 	logger.Infof("Function addBulkAsset called and length of arguments is:  %d", len(args))
// 	if len(args) >= 500 {
// 		logger.Errorf("Incorrect number of arguments in function CreateAsset, expecting less than 500, but got: %b", len(args))
// 		return shim.Error("Incorrect number of arguments, expecting 2")
// 	}

// 	var eventKeyValue []string

// 	for i, s := range args {

// 		key :=s[0];
// 		var car = Car{Make: s[1], Model: s[2], Colour: s[3], Owner: s[4]}

// 		eventKeyValue = strings.SplitN(s, "#", 3)
// 		if len(eventKeyValue) != 3 {
// 			logger.Errorf("Error occured, Please make sure that you have provided the array of strings and each string should be  in \"EventType#Key#Value\" format")
// 			return shim.Error("Error occured, Please make sure that you have provided the array of strings and each string should be  in \"EventType#Key#Value\" format")
// 		}

// 		assetAsBytes := []byte(eventKeyValue[2])
// 		err := APIstub.PutState(eventKeyValue[1], assetAsBytes)
// 		if err != nil {
// 			logger.Errorf("Error coocured while putting state for asset %s in APIStub, error: %s", eventKeyValue[1], err.Error())
// 			return shim.Error(err.Error())
// 		}
// 		// logger.infof("Adding value for ")
// 		fmt.Println(i, s)

// 		indexName := "Event~Id"
// 		eventAndIDIndexKey, err2 := APIstub.CreateCompositeKey(indexName, []string{eventKeyValue[0], eventKeyValue[1]})

// 		if err2 != nil {
// 			logger.Errorf("Error coocured while putting state in APIStub, error: %s", err.Error())
// 			return shim.Error(err2.Error())
// 		}

// 		value := []byte{0x00}
// 		err = APIstub.PutState(eventAndIDIndexKey, value)
// 		if err != nil {
// 			logger.Errorf("Error coocured while putting state in APIStub, error: %s", err.Error())
// 			return shim.Error(err.Error())
// 		}
// 		// logger.Infof("Created Composite key : %s", eventAndIDIndexKey)

// 	}

// 	return shim.Success(nil)
// }

// The main function is only relevant in unit test mode. Only included here for completeness.
func main() {

	// Create a new Smart Contract
	err := shim.Start(new(SmartContract))
	if err != nil {
		fmt.Printf("Error creating new Smart Contract: %s", err)
	}
}