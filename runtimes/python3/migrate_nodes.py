#!/usr/bin/env python3
"""
Automated Node Migration Script
Migrates all Python nodes from NanoService to BlokService
Following TDD approach - validates each migration
"""

import os
import re
from pathlib import Path
from typing import List, Tuple

class NodeMigrator:
    def __init__(self, nodes_dir: str = "nodes"):
        self.nodes_dir = Path(nodes_dir)
        self.migrations_completed = []
        self.migrations_failed = []
    
    def find_node_files(self) -> List[Path]:
        """Find all node.py files that need migration"""
        node_files = []
        for root, dirs, files in os.walk(self.nodes_dir):
            for file in files:
                if file == "node.py":
                    file_path = Path(root) / file
                    node_files.append(file_path)
        return node_files
    
    def needs_migration(self, file_path: Path) -> bool:
        """Check if a node file needs migration"""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if it still uses NanoService
        return ("from core.nanoservice import NanoService" in content or 
                "class" in content and "NanoService" in content)
    
    def migrate_node_file(self, file_path: Path) -> Tuple[bool, str]:
        """Migrate a single node file from NanoService to BlokService"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Pattern-based migration
            migrations = [
                # Import statements
                (r'from core\.nanoservice import NanoService', 
                 'from core.blok_service import BlokService'),
                
                (r'from core\.types\.nanoservice_response import NanoServiceResponse', 
                 'from core.types.blok_response import BlokResponse'),
                
                # Class inheritance
                (r'class (\w+)\(NanoService\):', 
                 r'class \1(BlokService):'),
                
                # Constructor calls
                (r'NanoService\.__init__\(self\)', 
                 'BlokService.__init__(self)'),
                
                # Type hints and return types
                (r'-> NanoServiceResponse:', 
                 '-> BlokResponse:'),
                
                # Object instantiation
                (r'NanoServiceResponse\(\)', 
                 'BlokResponse()'),
            ]
            
            # Apply migrations
            migrated_content = content
            for pattern, replacement in migrations:
                migrated_content = re.sub(pattern, replacement, migrated_content)
            
            # Verify migration was applied
            if migrated_content == content:
                return False, "No changes needed or pattern not found"
            
            # Write migrated content back
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(migrated_content)
            
            return True, "Migration successful"
            
        except Exception as e:
            return False, f"Migration failed: {str(e)}"
    
    def validate_migration(self, file_path: Path) -> Tuple[bool, str]:
        """Validate that migration was successful"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check that old imports/classes are gone
            if "from core.nanoservice import NanoService" in content:
                return False, "Still contains NanoService import"
            
            if "NanoServiceResponse" in content:
                return False, "Still contains NanoServiceResponse"
            
            if "class" in content and "NanoService" in content:
                return False, "Still inherits from NanoService"
            
            # Check that new imports/classes are present
            if "from core.blok_service import BlokService" not in content:
                return False, "Missing BlokService import"
            
            if "from core.types.blok_response import BlokResponse" not in content:
                return False, "Missing BlokResponse import"
            
            if "class" in content and "BlokService" not in content:
                return False, "Not inheriting from BlokService"
            
            return True, "Migration validated successfully"
            
        except Exception as e:
            return False, f"Validation failed: {str(e)}"
    
    def migrate_all_nodes(self) -> dict:
        """Migrate all nodes and return summary"""
        node_files = self.find_node_files()
        results = {
            "total_files": len(node_files),
            "migrated": 0,
            "skipped": 0,
            "failed": 0,
            "details": []
        }
        
        print(f"Found {len(node_files)} node files to check for migration")
        
        for file_path in node_files:
            print(f"\nProcessing: {file_path}")
            
            if not self.needs_migration(file_path):
                print(f"  ✅ Already migrated, skipping")
                results["skipped"] += 1
                results["details"].append({
                    "file": str(file_path),
                    "status": "skipped",
                    "message": "Already migrated"
                })
                continue
            
            # Perform migration
            success, message = self.migrate_node_file(file_path)
            
            if not success:
                print(f"  ❌ Migration failed: {message}")
                results["failed"] += 1
                results["details"].append({
                    "file": str(file_path),
                    "status": "failed",
                    "message": message
                })
                continue
            
            # Validate migration
            valid, validation_message = self.validate_migration(file_path)
            
            if not valid:
                print(f"  ❌ Validation failed: {validation_message}")
                results["failed"] += 1
                results["details"].append({
                    "file": str(file_path),
                    "status": "failed",
                    "message": f"Validation failed: {validation_message}"
                })
                continue
            
            print(f"  ✅ Successfully migrated and validated")
            results["migrated"] += 1
            results["details"].append({
                "file": str(file_path),
                "status": "success",
                "message": "Successfully migrated and validated"
            })
        
        return results

def main():
    print("🔄 Python Node Migration Script")
    print("Migrating from NanoService to BlokService")
    print("=" * 50)
    
    migrator = NodeMigrator()
    results = migrator.migrate_all_nodes()
    
    print("\n" + "=" * 50)
    print("📊 MIGRATION SUMMARY")
    print(f"Total files processed: {results['total_files']}")
    print(f"✅ Successfully migrated: {results['migrated']}")
    print(f"⚠️  Already migrated (skipped): {results['skipped']}")
    print(f"❌ Failed: {results['failed']}")
    
    if results['failed'] > 0:
        print("\n🚨 FAILED MIGRATIONS:")
        for detail in results['details']:
            if detail['status'] == 'failed':
                print(f"  - {detail['file']}: {detail['message']}")
    
    if results['migrated'] > 0:
        print("\n🎉 SUCCESSFUL MIGRATIONS:")
        for detail in results['details']:
            if detail['status'] == 'success':
                print(f"  - {detail['file']}")
    
    success_rate = (results['migrated'] + results['skipped']) / results['total_files'] * 100
    print(f"\n✨ Overall Success Rate: {success_rate:.1f}%")
    
    return results['failed'] == 0

if __name__ == "__main__":
    success = main()
    if success:
        print("\n🚀 All migrations completed successfully!")
        exit(0)
    else:
        print("\n💥 Some migrations failed. Please check the details above.")
        exit(1)
