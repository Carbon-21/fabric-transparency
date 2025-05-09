/*
	2021 Baran Kılıç <baran.kilic@boun.edu.tr>

	SPDX-License-Identifier: Apache-2.0
*/

package chaincode

import (
	"encoding/json"
	"fmt"
	"sort"
	"strconv"
	"strings"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

const uriKey = "uri"
const balancePrefix = "account~tokenId~sender"
const approvalPrefix = "account~operator"

const minterMSPID = "Org1"

// SmartContract provides functions for transferring tokens between accounts
type SmartContract struct {
	contractapi.Contract
}

// TransferSingle MUST emit when a single token is transferred, including zero
// value transfers as well as minting or burning.
// The operator argument MUST be msg.sender.
// The from argument MUST be the address of the holder whose balance is decreased.
// The to argument MUST be the address of the recipient whose balance is increased.
// The id argument MUST be the token type being transferred.
// The value argument MUST be the number of tokens the holder balance is decreased
// by and match what the recipient balance is increased by.
// When minting/creating tokens, the from argument MUST be set to `0x0` (i.e. zero address).
// When burning/destroying tokens, the to argument MUST be set to `0x0` (i.e. zero address).
type TransferSingle struct {
	Operator string `json:"operator"`
	From     string `json:"from"`
	To       string `json:"to"`
	ID       string `json:"id"`
	Value    uint64 `json:"value"`
}

// TransferBatch MUST emit when tokens are transferred, including zero value
// transfers as well as minting or burning.
// The operator argument MUST be msg.sender.
// The from argument MUST be the address of the holder whose balance is decreased.
// The to argument MUST be the address of the recipient whose balance is increased.
// The ids argument MUST be the list of tokens being transferred.
// The values argument MUST be the list of number of tokens (matching the list
// and order of tokens specified in _ids) the holder balance is decreased by
// and match what the recipient balance is increased by.
// When minting/creating tokens, the from argument MUST be set to `0x0` (i.e. zero address).
// When burning/destroying tokens, the to argument MUST be set to `0x0` (i.e. zero address).
type TransferBatch struct {
	Operator string   `json:"operator"`
	From     string   `json:"from"`
	To       string   `json:"to"`
	IDs      []string `json:"ids"`
	Values   []uint64 `json:"values"`
}

// TransferBatchMultiRecipient MUST emit when tokens are transferred, including zero value
// transfers as well as minting or burning.
// The operator argument MUST be msg.sender.
// The from argument MUST be the address of the holder whose balance is decreased.
// The to argument MUST be the list of the addresses of the recipients whose balance is increased.
// The ids argument MUST be the list of tokens being transferred.
// The values argument MUST be the list of number of tokens (matching the list
// and order of tokens specified in _ids) the holder balance is decreased by
// and match what the recipient balance is increased by.
// When minting/creating tokens, the from argument MUST be set to `0x0` (i.e. zero address).
// When burning/destroying tokens, the to argument MUST be set to `0x0` (i.e. zero address).
type TransferBatchMultiRecipient struct {
	Operator string   `json:"operator"`
	From     string   `json:"from"`
	To       []string `json:"to"`
	IDs      []string `json:"ids"`
	Values   []uint64 `json:"values"`
}

// ApprovalForAll MUST emit when approval for a second party/operator address
// to manage all tokens for an owner address is enabled or disabled
// (absence of an event assumes disabled).
type ApprovalForAll struct {
	Owner    string `json:"owner"`
	Operator string `json:"operator"`
	Approved bool   `json:"approved"`
}

// URI MUST emit when the URI is updated for a token ID.
// Note: This event is not used in this contract implementation because in this implementation,
// only the programmatic way of setting URI is used. The URI should contain {id} as part of it
// and the clients MUST replace this with the actual token ID.
// e.g.: http://token/{id}.json
type URI struct {
	ID    string `json:"id"`
	Value string `json:"value"`
}

// To represents recipient address
// ID represents token ID
type ToID struct {
	To string
	ID string
}

//returns whole world state
func (s *SmartContract) GetWorldState(ctx contractapi.TransactionContextInterface) ([][]string, error) {

	// Slice de slices que conterá os tokens e suas quantidades
	var tokens [][]string

	// Get all transactions
	balanceIterator, err := ctx.GetStub().GetStateByPartialCompositeKey(balancePrefix, []string{})
	if err != nil {
		return nil, fmt.Errorf("Erro ao obter o prefixo %v: %v", balancePrefix, err)
	}
	defer balanceIterator.Close()

	// Itera pelos pares chave/valor que deram match
	for balanceIterator.HasNext() {
		queryResponse, err := balanceIterator.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to get the next state for prefix %v: %v", balancePrefix, err)
		}

		// Split the key
		_, compositeKeyParts, err := ctx.GetStub().SplitCompositeKey(queryResponse.Key)
		if err != nil {
			return nil, fmt.Errorf("failed to get key: %s", err)
		}

		// Get key parts
		tokenAccount := compositeKeyParts[0]
		tokenID := compositeKeyParts[1]
		tokenSender := compositeKeyParts[2]
		// metadata := compositeKeyParts[3]

		// Get value
		tokenAmount := queryResponse.Value

		//! Add info to the array of arrays
		element := []string{tokenAccount, tokenID, tokenSender, string(tokenAmount)}
		tokens = append(tokens, element)
		// }
	}

	return tokens, nil
}

// Mint creates amount tokens of token type id and assigns them to account.
// This function emits a TransferSingle event.
func (s *SmartContract) Mint(ctx contractapi.TransactionContextInterface, account string, id string, amount uint64) error {

	// Check minter authorization - this sample assumes Org1 is the central banker with privilege to mint new tokens
	// Observação: verificação de autorização comentada
	// err := authorizationHelper(ctx)
	// if err != nil {
	// 	return err
	// }

	// Get ID of submitting client identity
	operator, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return fmt.Errorf("failed to get client id: %v", err)
	}

	// Mint tokens
	err = mintHelper(ctx, operator, account, id, amount)
	if err != nil {
		return err
	}

	// Emit TransferSingle event
	transferSingleEvent := TransferSingle{operator, "0x0", account, id, amount}
	return emitTransferSingle(ctx, transferSingleEvent)
}

// MintBatch creates amount tokens for each token type id and assigns them to account.
// This function emits a TransferBatch event.
func (s *SmartContract) MintBatch(ctx contractapi.TransactionContextInterface, account string, ids []string, amounts []uint64) error {

	if len(ids) != len(amounts) {
		return fmt.Errorf("ids and amounts must have the same length")
	}

	// Check minter authorization - this sample assumes Org1 is the central banker with privilege to mint new tokens
	err := authorizationHelper(ctx)
	if err != nil {
		return err
	}

	// Get ID of submitting client identity
	operator, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return fmt.Errorf("failed to get client id: %v", err)
	}

	// Group amount by token id because we can only send token to a recipient only one time in a block. This prevents key conflicts
	amountToSend := make(map[string]uint64) // token id => amount

	for i := 0; i < len(amounts); i++ {
		amountToSend[ids[i]] += amounts[i]
	}

	// Copy the map keys and sort it. This is necessary because iterating maps in Go is not deterministic
	amountToSendKeys := sortedKeys(amountToSend)

	// Mint tokens
	for _, id := range amountToSendKeys {
		amount := amountToSend[id]
		err = mintHelper(ctx, operator, account, id, amount)
		if err != nil {
			return err
		}
	}

	// Emit TransferBatch event
	transferBatchEvent := TransferBatch{operator, "0x0", account, ids, amounts}
	return emitTransferBatch(ctx, transferBatchEvent)
}

// Burn destroys amount tokens of token type id from account.
// This function triggers a TransferSingle event.
func (s *SmartContract) Burn(ctx contractapi.TransactionContextInterface, account string, id string, amount uint64) error {

	if account == "0x0" {
		return fmt.Errorf("burn to the zero address")
	}

	// Check minter authorization - this sample assumes Org1 is the central banker with privilege to burn new tokens
	err := authorizationHelper(ctx)
	if err != nil {
		return err
	}

	// Get ID of submitting client identity
	operator, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return fmt.Errorf("failed to get client id: %v", err)
	}

	// Burn tokens
	err = removeBalance(ctx, account, []string{id}, []uint64{amount})
	if err != nil {
		return err
	}

	transferSingleEvent := TransferSingle{operator, account, "0x0", id, amount}
	return emitTransferSingle(ctx, transferSingleEvent)
}

// BurnBatch destroys amount tokens of for each token type id from account.
// This function emits a TransferBatch event.
func (s *SmartContract) BurnBatch(ctx contractapi.TransactionContextInterface, account string, ids []string, amounts []uint64) error {

	if account == "0x0" {
		return fmt.Errorf("burn to the zero address")
	}

	if len(ids) != len(amounts) {
		return fmt.Errorf("ids and amounts must have the same length")
	}

	// Check minter authorization - this sample assumes Org1 is the central banker with privilege to burn new tokens
	err := authorizationHelper(ctx)
	if err != nil {
		return err
	}

	// Get ID of submitting client identity
	operator, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return fmt.Errorf("failed to get client id: %v", err)
	}

	err = removeBalance(ctx, account, ids, amounts)
	if err != nil {
		return err
	}

	transferBatchEvent := TransferBatch{operator, account, "0x0", ids, amounts}
	return emitTransferBatch(ctx, transferBatchEvent)
}

// TransferFrom transfers tokens from sender account to recipient account
// recipient account must be a valid clientID as returned by the ClientID() function
// This function triggers a TransferSingle event
func (s *SmartContract) TransferFrom(ctx contractapi.TransactionContextInterface, sender string, recipient string, id string, amount uint64) error {
	if sender == recipient {
		return fmt.Errorf("transfer to self")
	}

	// Get ID of submitting client identity
	operator, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return fmt.Errorf("failed to get client id: %v", err)
	}

	// Check whether operator is owner or approved
	if operator != sender {
		approved, err := _isApprovedForAll(ctx, sender, operator)
		if err != nil {
			return err
		}
		if !approved {
			return fmt.Errorf("caller is not owner nor is approved")
		}
	}

	// Withdraw the funds from the sender address
	err = removeBalance(ctx, operator, []string{id}, []uint64{amount})
	if err != nil {
		return err
	}

	if recipient == "0x0" {
		return fmt.Errorf("transfer to the zero address")
	}

	// Deposit the fund to the recipient address
	err = addBalance(ctx, operator, recipient, id, amount)
	if err != nil {
		return err
	}

	// Emit TransferSingle event
	transferSingleEvent := TransferSingle{operator, operator, recipient, id, amount}
	return emitTransferSingle(ctx, transferSingleEvent)
}

// BatchTransferFrom transfers multiple tokens from sender account to recipient account
// recipient account must be a valid clientID as returned by the ClientID() function
// This function triggers a TransferBatch event
func (s *SmartContract) BatchTransferFrom(ctx contractapi.TransactionContextInterface, sender string, recipient string, ids []string, amounts []uint64) error {
	if sender == recipient {
		return fmt.Errorf("transfer to self")
	}

	if len(ids) != len(amounts) {
		return fmt.Errorf("ids and amounts must have the same length")
	}

	// Get ID of submitting client identity
	operator, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return fmt.Errorf("failed to get client id: %v", err)
	}

	// Check whether operator is owner or approved
	if operator != sender {
		approved, err := _isApprovedForAll(ctx, sender, operator)
		if err != nil {
			return err
		}
		if !approved {
			return fmt.Errorf("caller is not owner nor is approved")
		}
	}

	// Withdraw the funds from the sender address
	err = removeBalance(ctx, sender, ids, amounts)
	if err != nil {
		return err
	}

	if recipient == "0x0" {
		return fmt.Errorf("transfer to the zero address")
	}

	// Group amount by token id because we can only send token to a recipient only one time in a block. This prevents key conflicts
	amountToSend := make(map[string]uint64) // token id => amount

	for i := 0; i < len(amounts); i++ {
		amountToSend[ids[i]] += amounts[i]
	}

	// Copy the map keys and sort it. This is necessary because iterating maps in Go is not deterministic
	amountToSendKeys := sortedKeys(amountToSend)

	// Deposit the funds to the recipient address
	for _, id := range amountToSendKeys {
		amount := amountToSend[id]
		err = addBalance(ctx, sender, recipient, id, amount)
		if err != nil {
			return err
		}
	}

	transferBatchEvent := TransferBatch{operator, sender, recipient, ids, amounts}
	return emitTransferBatch(ctx, transferBatchEvent)
}

// BatchTransferFromMultiRecipient transfers multiple tokens from sender account to multiple recipient accounts
// recipient account must be a valid clientID as returned by the ClientID() function
// This function triggers a TransferBatchMultiRecipient event
func (s *SmartContract) BatchTransferFromMultiRecipient(ctx contractapi.TransactionContextInterface, sender string, recipients []string, ids []string, amounts []uint64) error {

	if len(recipients) != len(ids) || len(ids) != len(amounts) {
		return fmt.Errorf("recipients, ids, and amounts must have the same length")
	}

	for _, recipient := range recipients {
		if sender == recipient {
			return fmt.Errorf("transfer to self")
		}
	}

	// Get ID of submitting client identity
	operator, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return fmt.Errorf("failed to get client id: %v", err)
	}

	// Check whether operator is owner or approved
	if operator != sender {
		approved, err := _isApprovedForAll(ctx, sender, operator)
		if err != nil {
			return err
		}
		if !approved {
			return fmt.Errorf("caller is not owner nor is approved")
		}
	}

	// Withdraw the funds from the sender address
	err = removeBalance(ctx, sender, ids, amounts)
	if err != nil {
		return err
	}

	// Group amount by (recipient, id ) pair because we can only send token to a recipient only one time in a block. This prevents key conflicts
	amountToSend := make(map[ToID]uint64) // (recipient, id ) => amount

	for i := 0; i < len(amounts); i++ {
		amountToSend[ToID{recipients[i], ids[i]}] += amounts[i]
	}

	// Copy the map keys and sort it. This is necessary because iterating maps in Go is not deterministic
	amountToSendKeys := sortedKeysToID(amountToSend)

	// Deposit the funds to the recipient addresses
	for _, key := range amountToSendKeys {
		if key.To == "0x0" {
			return fmt.Errorf("transfer to the zero address")
		}

		amount := amountToSend[key]

		err = addBalance(ctx, sender, key.To, key.ID, amount)
		if err != nil {
			return err
		}
	}

	// Emit TransferBatchMultiRecipient event
	transferBatchMultiRecipientEvent := TransferBatchMultiRecipient{operator, sender, recipients, ids, amounts}
	return emitTransferBatchMultiRecipient(ctx, transferBatchMultiRecipientEvent)
}

// IsApprovedForAll returns true if operator is approved to transfer account's tokens.
func (s *SmartContract) IsApprovedForAll(ctx contractapi.TransactionContextInterface, account string, operator string) (bool, error) {
	return _isApprovedForAll(ctx, account, operator)
}

// _isApprovedForAll returns true if operator is approved to transfer account's tokens.
func _isApprovedForAll(ctx contractapi.TransactionContextInterface, account string, operator string) (bool, error) {
	approvalKey, err := ctx.GetStub().CreateCompositeKey(approvalPrefix, []string{account, operator})
	if err != nil {
		return false, fmt.Errorf("failed to create the composite key for prefix %s: %v", approvalPrefix, err)
	}

	approvalBytes, err := ctx.GetStub().GetState(approvalKey)
	if err != nil {
		return false, fmt.Errorf("failed to read approval of operator %s for account %s from world state: %v", operator, account, err)
	}

	if approvalBytes == nil {
		return false, nil
	}

	var approved bool
	err = json.Unmarshal(approvalBytes, &approved)
	if err != nil {
		return false, fmt.Errorf("failed to decode approval JSON of operator %s for account %s: %v", operator, account, err)
	}

	return approved, nil
}

// SetApprovalForAll returns true if operator is approved to transfer account's tokens.
func (s *SmartContract) SetApprovalForAll(ctx contractapi.TransactionContextInterface, operator string, approved bool) error {
	// Get ID of submitting client identity
	account, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return fmt.Errorf("failed to get client id: %v", err)
	}

	if account == operator {
		return fmt.Errorf("setting approval status for self")
	}

	approvalForAllEvent := ApprovalForAll{account, operator, approved}
	approvalForAllEventJSON, err := json.Marshal(approvalForAllEvent)
	if err != nil {
		return fmt.Errorf("failed to obtain JSON encoding: %v", err)
	}
	err = ctx.GetStub().SetEvent("ApprovalForAll", approvalForAllEventJSON)
	if err != nil {
		return fmt.Errorf("failed to set event: %v", err)
	}

	approvalKey, err := ctx.GetStub().CreateCompositeKey(approvalPrefix, []string{account, operator})
	if err != nil {
		return fmt.Errorf("failed to create the composite key for prefix %s: %v", approvalPrefix, err)
	}

	approvalJSON, err := json.Marshal(approved)
	if err != nil {
		return fmt.Errorf("failed to encode approval JSON of operator %s for account %s: %v", operator, account, err)
	}

	err = ctx.GetStub().PutState(approvalKey, approvalJSON)
	if err != nil {
		return err
	}

	return nil
}

// BalanceOf returns the balance of the given account
func (s *SmartContract) BalanceOf(ctx contractapi.TransactionContextInterface, account string, id string) (uint64, error) {
	return balanceOfHelper(ctx, account, id)
}

// BalanceOfBatch returns the balance of multiple account/token pairs
func (s *SmartContract) BalanceOfBatch(ctx contractapi.TransactionContextInterface, accounts []string, ids []string) ([]uint64, error) {
	if len(accounts) != len(ids) {
		return nil, fmt.Errorf("accounts and ids must have the same length")
	}

	balances := make([]uint64, len(accounts))

	for i := 0; i < len(accounts); i++ {
		var err error
		balances[i], err = balanceOfHelper(ctx, accounts[i], ids[i])
		if err != nil {
			return nil, err
		}
	}

	return balances, nil
}

// SelfBalance returns the balance of the requesting client's account
// Note: Originally, ClientAccountBalance
func (s *SmartContract) SelfBalance(ctx contractapi.TransactionContextInterface, id string) (uint64, error) {

	// Get ID of submitting client identity
	clientID, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return 0, fmt.Errorf("failed to get client id: %v", err)
	}

	return balanceOfHelper(ctx, clientID, id)
}

// ClientAccountID returns the id of the requesting client's account
// In this implementation, the client account ID is the clientId itself
// Users can use this function to get their own account id, which they can then give to others as the payment address
func (s *SmartContract) ClientAccountID(ctx contractapi.TransactionContextInterface) (string, error) {
	// Get ID of submitting client identity
	clientAccountID, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return "", fmt.Errorf("failed to get client id: %v", err)
	}

	return clientAccountID, nil
}

// SetURI set the URI value
// This function triggers URI event for each token id
func (s *SmartContract) SetURI(ctx contractapi.TransactionContextInterface, uri string) error {

	// Check minter authorization - this sample assumes Org1 is the central banker with privilege to mint new tokens
	err := authorizationHelper(ctx)
	if err != nil {
		return err
	}

	if !strings.Contains(uri, "{id}") {
		return fmt.Errorf("failed to set uri, uri should contain '{id}'")
	}

	err = ctx.GetStub().PutState(uriKey, []byte(uri))
	if err != nil {
		return fmt.Errorf("failed to set uri: %v", err)
	}

	return nil
}

// URI returns the URI
func (s *SmartContract) URI(ctx contractapi.TransactionContextInterface, id uint64) (string, error) {

	uriBytes, err := ctx.GetStub().GetState(uriKey)
	if err != nil {
		return "", fmt.Errorf("failed to get uri: %v", err)
	}

	if uriBytes == nil {
		return "", fmt.Errorf("no uri is set: %v", err)
	}

	return string(uriBytes), nil
}

func (s *SmartContract) BroadcastTokenExistance(ctx contractapi.TransactionContextInterface, id string) error {

	// Check minter authorization - this sample assumes Org1 is the central banker with privilege to mint new tokens
	err := authorizationHelper(ctx)
	if err != nil {
		return err
	}

	// Get ID of submitting client identity
	operator, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return fmt.Errorf("failed to get client id: %v", err)
	}

	// Emit TransferSingle event
	transferSingleEvent := TransferSingle{operator, "0x0", "0x0", id, 0}
	return emitTransferSingle(ctx, transferSingleEvent)
}

// Helper Functions

// authorizationHelper checks minter authorization - this sample assumes Org1 is the central banker with privilege to mint new tokens.
func authorizationHelper(ctx contractapi.TransactionContextInterface) error {

	// Get org of submitting client identity and check if it is minterMSPID
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get MSPID: %v", err)
	}
	if clientMSPID != minterMSPID {
		return fmt.Errorf("not authorized to mint")
	}

	return nil
}

func mintHelper(ctx contractapi.TransactionContextInterface, operator string, account string, id string, amount uint64) error {
	if account == "0x0" {
		return fmt.Errorf("mint to the zero address")
	}

	if amount <= 0 {
		return fmt.Errorf("amount must be positive integer")
	}

	err := addBalance(ctx, operator, account, id, amount)
	if err != nil {
		return err
	}

	return nil
}

func addBalance(ctx contractapi.TransactionContextInterface, sender string, recipient string, idString string, amount uint64) error {

	balanceKey, err := ctx.GetStub().CreateCompositeKey(balancePrefix, []string{recipient, idString, sender})
	if err != nil {
		return fmt.Errorf("failed to create the composite key for prefix %s: %v", balancePrefix, err)
	}

	balanceBytes, err := ctx.GetStub().GetState(balanceKey)
	if err != nil {
		return fmt.Errorf("failed to read account %s from world state: %v", recipient, err)
	}

	var balance uint64 = 0
	if balanceBytes != nil {
		balance, _ = strconv.ParseUint(string(balanceBytes), 10, 64)
	}

	balance += amount

	err = ctx.GetStub().PutState(balanceKey, []byte(strconv.FormatUint(uint64(balance), 10)))
	if err != nil {
		return err
	}

	return nil
}

func setBalance(ctx contractapi.TransactionContextInterface, sender string, recipient string, idString string, amount uint64) error {

	balanceKey, err := ctx.GetStub().CreateCompositeKey(balancePrefix, []string{recipient, idString, sender})
	if err != nil {
		return fmt.Errorf("failed to create the composite key for prefix %s: %v", balancePrefix, err)
	}

	err = ctx.GetStub().PutState(balanceKey, []byte(strconv.FormatUint(uint64(amount), 10)))
	if err != nil {
		return err
	}

	return nil
}

func removeBalance(ctx contractapi.TransactionContextInterface, sender string, ids []string, amounts []uint64) error {
	// Calculate the total amount of each token to withdraw
	necessaryFunds := make(map[string]uint64) // token id -> necessary amount

	for i := 0; i < len(amounts); i++ {
		necessaryFunds[ids[i]] += amounts[i]
	}

	// Copy the map keys and sort it. This is necessary because iterating maps in Go is not deterministic
	necessaryFundsKeys := sortedKeys(necessaryFunds)

	// Check whether the sender has the necessary funds and withdraw them from the account
	for _, tokenId := range necessaryFundsKeys {
		neededAmount, _ := necessaryFunds[tokenId]

		var partialBalance uint64
		var selfRecipientKeyNeedsToBeRemoved bool
		var selfRecipientKey string

		balanceIterator, err := ctx.GetStub().GetStateByPartialCompositeKey(balancePrefix, []string{sender, tokenId})
		if err != nil {
			return fmt.Errorf("failed to get state for prefix %v: %v", balancePrefix, err)
		}
		defer balanceIterator.Close()

		// Iterate over keys that store balances and add them to partialBalance until
		// either the necessary amount is reached or the keys ended
		for balanceIterator.HasNext() && partialBalance < neededAmount {
			queryResponse, err := balanceIterator.Next()
			if err != nil {
				return fmt.Errorf("failed to get the next state for prefix %v: %v", balancePrefix, err)
			}

			partBalAmount, _ := strconv.ParseUint(string(queryResponse.Value), 10, 64)
			partialBalance += partBalAmount

			_, compositeKeyParts, err := ctx.GetStub().SplitCompositeKey(queryResponse.Key)
			if err != nil {
				return err
			}

			if compositeKeyParts[2] == sender {
				selfRecipientKeyNeedsToBeRemoved = true
				selfRecipientKey = queryResponse.Key
			} else {
				err = ctx.GetStub().DelState(queryResponse.Key)
				if err != nil {
					return fmt.Errorf("failed to delete the state of %v: %v", queryResponse.Key, err)
				}
			}
		}

		if partialBalance < neededAmount {
			return fmt.Errorf("Sender does not have enough %v. Request amount: %v. Available amount: %v", tokenId, neededAmount, partialBalance)
		} else if partialBalance > neededAmount {
			// Send the remainder back to the sender
			remainder := partialBalance - neededAmount
			if selfRecipientKeyNeedsToBeRemoved {
				// Set balance for the key that has the same address for sender and recipient
				err = setBalance(ctx, sender, sender, tokenId, remainder)
				if err != nil {
					return err
				}
			} else {
				err = addBalance(ctx, sender, sender, tokenId, remainder)
				if err != nil {
					return err
				}
			}

		} else {
			// Delete self recipient key
			err = ctx.GetStub().DelState(selfRecipientKey)
			if err != nil {
				return fmt.Errorf("failed to delete the state of %v: %v", selfRecipientKey, err)
			}
		}
	}

	return nil
}

func emitTransferSingle(ctx contractapi.TransactionContextInterface, transferSingleEvent TransferSingle) error {
	transferSingleEventJSON, err := json.Marshal(transferSingleEvent)
	if err != nil {
		return fmt.Errorf("failed to obtain JSON encoding: %v", err)
	}

	err = ctx.GetStub().SetEvent("TransferSingle", transferSingleEventJSON)
	if err != nil {
		return fmt.Errorf("failed to set event: %v", err)
	}

	return nil
}

func emitTransferBatch(ctx contractapi.TransactionContextInterface, transferBatchEvent TransferBatch) error {
	transferBatchEventJSON, err := json.Marshal(transferBatchEvent)
	if err != nil {
		return fmt.Errorf("failed to obtain JSON encoding: %v", err)
	}
	err = ctx.GetStub().SetEvent("TransferBatch", transferBatchEventJSON)
	if err != nil {
		return fmt.Errorf("failed to set event: %v", err)
	}

	return nil
}

func emitTransferBatchMultiRecipient(ctx contractapi.TransactionContextInterface, transferBatchMultiRecipientEvent TransferBatchMultiRecipient) error {
	transferBatchMultiRecipientEventJSON, err := json.Marshal(transferBatchMultiRecipientEvent)
	if err != nil {
		return fmt.Errorf("failed to obtain JSON encoding: %v", err)
	}
	err = ctx.GetStub().SetEvent("TransferBatchMultiRecipient", transferBatchMultiRecipientEventJSON)
	if err != nil {
		return fmt.Errorf("failed to set event: %v", err)
	}

	return nil
}

func emitSetURI(ctx contractapi.TransactionContextInterface, setURIevent URI) error {
	setURIeventJSON, err := json.Marshal(setURIevent)
	if err != nil {
		return fmt.Errorf("failed to obtain JSON encoding: %v", err)
	}

	err = ctx.GetStub().SetEvent("setURI", setURIeventJSON)
	if err != nil {
		return fmt.Errorf("failed to set event: %v", err)
	}

	return nil
}

// balanceOfHelper returns the balance of the given account
func balanceOfHelper(ctx contractapi.TransactionContextInterface, account string, idString string) (uint64, error) {

	if account == "0x0" {
		return 0, fmt.Errorf("balance query for the zero address")
	}

	var balance uint64

	balanceIterator, err := ctx.GetStub().GetStateByPartialCompositeKey(balancePrefix, []string{account, idString})
	if err != nil {
		return 0, fmt.Errorf("failed to get state for prefix %v: %v", balancePrefix, err)
	}
	defer balanceIterator.Close()

	for balanceIterator.HasNext() {
		queryResponse, err := balanceIterator.Next()
		if err != nil {
			return 0, fmt.Errorf("failed to get the next state for prefix %v: %v", balancePrefix, err)
		}

		balAmount, _ := strconv.ParseUint(string(queryResponse.Value), 10, 64)
		balance += balAmount
	}

	return balance, nil
}

// Returns the sorted slice ([]string) copied from the keys of map[string]uint64
func sortedKeys(m map[string]uint64) []string {
	// Copy map keys to slice
	keys := make([]string, len(m))
	i := 0
	for k := range m {
		keys[i] = k
		i++
	}
	// Sort the slice
	sort.Slice(keys, func(i, j int) bool { return keys[i] < keys[j] })
	return keys
}

// Returns the sorted slice ([]ToID) copied from the keys of map[ToID]uint64
func sortedKeysToID(m map[ToID]uint64) []ToID {
	// Copy map keys to slice
	keys := make([]ToID, len(m))
	i := 0
	for k := range m {
		keys[i] = k
		i++
	}
	// Sort the slice first according to ID if equal then sort by recipient ("To" field)
	sort.Slice(keys, func(i, j int) bool {
		if keys[i].ID != keys[j].ID {
			return keys[i].To < keys[j].To
		}
		return keys[i].ID < keys[j].ID
	})
	return keys
}
