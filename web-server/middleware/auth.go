package middleware

import (
	"context"
	"fmt"
	"net/http"
	"os"

	"github.com/golang-jwt/jwt/v5"
)

func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("authToken")
		if err != nil {
			http.Error(w, fmt.Sprintf("no token found - %v", err), http.StatusUnauthorized)
			return
		}
		tokenStr := cookie.Value
		parser := jwt.NewParser(jwt.WithValidMethods([]string{"HS256"}), jwt.WithIssuer("home-media-web-server"))
		token, err := parser.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			return []byte(os.Getenv("API_SECRET")), nil
		})

		if err != nil || !token.Valid {
			http.Error(w, fmt.Sprintf("invalid token - %v", err), http.StatusUnauthorized)
			return
		}

		userId, err := token.Claims.GetSubject()
		if err != nil {
			http.Error(w, fmt.Sprintf("error retrieving user id from token - %v", err), http.StatusUnauthorized)
			return
		}

		r = r.WithContext(context.WithValue(r.Context(), "username", userId))

		next.ServeHTTP(w, r)
	})
}
