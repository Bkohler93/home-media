package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	db "github.com/bkohler93/home-media/web-server/db/go"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

func (h *Handler) CheckAuth(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
}

func (h *Handler) PostUser(w http.ResponseWriter, r *http.Request) {
	reqBody := struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}{}

	err := json.NewDecoder(r.Body).Decode(&reqBody)
	if err != nil {
		http.Error(w, fmt.Sprintf("invalid request body - %v", err), http.StatusBadRequest)
		return
	}
	pwhash, err := bcrypt.GenerateFromPassword([]byte(reqBody.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, fmt.Sprintf("failed to generate password hash - %v", err), http.StatusInternalServerError)
		return
	}
	u, err := h.q.CreateUser(context.Background(), db.CreateUserParams{
		UserName: reqBody.Username,
		PwHash:   string(pwhash),
	})
	if err != nil {
		http.Error(w, fmt.Sprintf("failed to create user - %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	err = json.NewEncoder(w).Encode(u)
	if err != nil {
		http.Error(w, fmt.Sprintf("failed to encode user - %v", err), http.StatusInternalServerError)
		return
	}
}

func (h *Handler) UserLogin(w http.ResponseWriter, r *http.Request) {
	reqBody := struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}{}
	err := json.NewDecoder(r.Body).Decode(&reqBody)
	if err != nil {
		http.Error(w, fmt.Sprintf("invalid request body - %v", err), http.StatusBadRequest)
		return
	}

	u, err := h.q.GetUserByName(context.Background(), reqBody.Username)
	if err != nil {
		http.Error(w, fmt.Sprintf("incorrect username or password - %v", err), http.StatusUnauthorized)
		return
	}
	err = bcrypt.CompareHashAndPassword([]byte(u.PwHash), []byte(reqBody.Password))
	if err != nil {
		http.Error(w, fmt.Sprintf("incorrect username or password - %v", err), http.StatusUnauthorized)
		return
	}

	key := os.Getenv("API_SECRET")
	t := jwt.NewWithClaims(jwt.SigningMethodHS256,
		jwt.MapClaims{
			"iss": "home-media-web-server",
			"sub": u.UserName,
			"id":  u.ID,
		})
	s, err := t.SignedString([]byte(key))
	if err != nil {
		http.Error(w, fmt.Sprintf("error signing token - %v", err), http.StatusInternalServerError)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "authToken",
		Value:    s,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Domain: "pupflix",
		Path: "/",
	})
//	w.Header().Add("Content-Type", "application/json")
// 	err = json.NewEncoder(w).Encode(&struct {
// 		Token string `json:"token"`
// 	}{
// 		Token: s,
// 	})
// 	if err != nil {
// 		http.Error(w, fmt.Sprintf("error encoding token - %v", err), http.StatusInternalServerError)
// 		return
// 	}
	w.WriteHeader(http.StatusOK)
}
